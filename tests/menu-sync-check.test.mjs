import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateMenuSync,
  fetchJsonLimited,
} from "../scripts/check-menu-sync.mjs";

const revisions = {
  "menu-hawaii": "hawaii-rev-2",
  "menu-muulab": "muulab-rev-2",
};

const sanityPayload = {
  result: Object.entries(revisions).map(([_id, _rev]) => ({ _id, _rev })),
};

const marker = (overrides = {}) => ({
  schemaVersion: 1,
  syncSuspended: false,
  documentRevisions: { ...revisions },
  ...overrides,
});

test("unchanged published revisions skip deployment", () => {
  assert.deepEqual(evaluateMenuSync(sanityPayload, marker()), {
    changed: false,
    cmsRevision: "hawaii-rev-2",
    reason: "unchanged",
  });
});

test("standard Sanity response metadata is accepted", () => {
  const response = { ...sanityPayload, ms: 3, query: "*[]", syncTags: ["tag"] };
  assert.equal(evaluateMenuSync(response, marker()).changed, false);
});

test("a changed revision requests deployment with a current revision", () => {
  const previous = marker({
    documentRevisions: { ...revisions, "menu-hawaii": "hawaii-rev-1" },
  });
  assert.deepEqual(evaluateMenuSync(sanityPayload, previous), {
    changed: true,
    cmsRevision: "hawaii-rev-2",
    reason: "changed",
  });
});

test("a local fallback marker requests recovery when Sanity returns", () => {
  const previous = marker({
    documentRevisions: {
      "menu-hawaii": "local-fallback:abc1234",
      "menu-muulab": "local-fallback:abc1234",
    },
  });
  assert.equal(evaluateMenuSync(sanityPayload, previous).changed, true);
});

test("a suspended rollback blocks scheduled deployment", () => {
  assert.deepEqual(evaluateMenuSync(sanityPayload, marker({ syncSuspended: true })), {
    changed: false,
    cmsRevision: "hawaii-rev-2",
    reason: "suspended",
  });
});

for (const [name, invalidSanity] of [
  ["partial Sanity payload", { result: sanityPayload.result.slice(0, 1) }],
  ["invalid Sanity revision", { result: [{ _id: "menu-hawaii", _rev: "bad revision" }, sanityPayload.result[1]] }],
]) {
  test(`${name} fails closed`, () => {
    assert.throws(() => evaluateMenuSync(invalidSanity, marker()), /Sanity/i);
  });
}

for (const [name, invalidMarker] of [
  ["missing marker", null],
  ["partial marker", { schemaVersion: 1, syncSuspended: false, documentRevisions: { "menu-hawaii": "x" } }],
  ["extra marker property", { ...marker(), extra: true }],
  ["invalid marker revision", marker({ documentRevisions: { ...revisions, "menu-hawaii": "bad revision" } })],
]) {
  test(`${name} fails closed`, () => {
    assert.throws(() => evaluateMenuSync(sanityPayload, invalidMarker), /marker/i);
  });
}

test("unreachable marker fails closed", async () => {
  await assert.rejects(
    fetchJsonLimited("http://127.0.0.1:1/menu-release.json", {
      label: "marker",
      maxBytes: 32 * 1024,
      timeoutMs: 100,
    }),
    /marker/i,
  );
});

test("marker timeout fails closed", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    });
  try {
    await assert.rejects(
      fetchJsonLimited("https://example.test/menu-release.json", {
        label: "marker",
        maxBytes: 32 * 1024,
        timeoutMs: 10,
      }),
      /marker.*timeout/i,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("marker larger than 32 KiB fails closed", async () => {
  const url = `data:application/json,${"x".repeat(32 * 1024 + 1)}`;
  await assert.rejects(
    fetchJsonLimited(url, { label: "marker", maxBytes: 32 * 1024, timeoutMs: 500 }),
    /marker.*large/i,
  );
});
