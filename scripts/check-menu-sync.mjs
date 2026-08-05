#!/usr/bin/env node

import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const documentIds = ["menu-hawaii", "menu-muulab"];
const revisionPattern = /^[A-Za-z0-9._-]{1,200}$/;
const markerRevisionPattern = /^(?:[A-Za-z0-9._-]{1,200}|local-fallback:(?:[a-f0-9]{7,64}|uncommitted))$/;

function fail(message) {
  throw new Error(message);
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function validateRevision(value, label, pattern = revisionPattern) {
  if (typeof value !== "string" || !pattern.test(value)) {
    fail(`${label} revision is invalid.`);
  }
  return value;
}

function sanityRevisions(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.result)) {
    fail("Sanity response is invalid.");
  }
  const revisions = {};
  for (const item of payload.result) {
    if (!exactKeys(item, ["_id", "_rev"]) || !documentIds.includes(item._id)) {
      fail("Sanity response contains an invalid document.");
    }
    if (Object.hasOwn(revisions, item._id)) fail("Sanity response contains duplicates.");
    revisions[item._id] = validateRevision(item._rev, "Sanity");
  }
  if (!exactKeys(revisions, [...documentIds].sort())) {
    fail("Sanity response is incomplete.");
  }
  return revisions;
}

function markerState(payload) {
  if (
    !exactKeys(payload, ["documentRevisions", "schemaVersion", "syncSuspended"]) ||
    payload.schemaVersion !== 1 ||
    typeof payload.syncSuspended !== "boolean" ||
    !exactKeys(payload.documentRevisions, [...documentIds].sort())
  ) {
    fail("Release marker is invalid.");
  }
  const documentRevisions = Object.fromEntries(
    documentIds.map((id) => [
      id,
      validateRevision(payload.documentRevisions[id], "Release marker", markerRevisionPattern),
    ]),
  );
  return { documentRevisions, syncSuspended: payload.syncSuspended };
}

export function evaluateMenuSync(sanityPayload, markerPayload) {
  const current = sanityRevisions(sanityPayload);
  const previous = markerState(markerPayload);
  const cmsRevision = current["menu-hawaii"];
  if (previous.syncSuspended) {
    return { changed: false, cmsRevision, reason: "suspended" };
  }
  const changed = documentIds.some((id) => current[id] !== previous.documentRevisions[id]);
  return { changed, cmsRevision, reason: changed ? "changed" : "unchanged" };
}

export async function fetchJsonLimited(url, { label, maxBytes, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok || !response.body) fail(`${label} request failed.`);
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > maxBytes) fail(`${label} response is too large.`);

    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        fail(`${label} response is too large.`);
      }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
    try {
      return JSON.parse(body);
    } catch {
      fail(`${label} response is not valid JSON.`);
    }
  } catch (error) {
    if (error?.name === "AbortError") fail(`${label} request timeout.`);
    if (error instanceof Error && error.message.startsWith(label)) throw error;
    fail(`${label} request failed.`);
  } finally {
    clearTimeout(timeout);
  }
}

function requiredEnvironment(name, pattern) {
  const value = process.env[name];
  if (!value || !pattern.test(value)) fail(`${name} is missing or invalid.`);
  return value;
}

async function main() {
  const projectId = requiredEnvironment("SANITY_PROJECT_ID", /^[a-z0-9-]+$/);
  const dataset = requiredEnvironment("SANITY_DATASET", /^[A-Za-z0-9_-]+$/);
  const apiVersion = requiredEnvironment("SANITY_API_VERSION", /^\d{4}-\d{2}-\d{2}$/);
  const markerUrl = requiredEnvironment("PAGES_MENU_RELEASE_URL", /^https:\/\//);
  const query = '*[_id in ["menu-hawaii","menu-muulab"]]{_id,_rev}';
  const sanityUrl = new URL(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${encodeURIComponent(dataset)}`,
  );
  sanityUrl.searchParams.set("query", query);
  sanityUrl.searchParams.set("perspective", "published");
  const liveMarkerUrl = new URL(markerUrl);
  liveMarkerUrl.searchParams.set("sync", String(Date.now()));

  const [sanityPayload, markerPayload] = await Promise.all([
    fetchJsonLimited(sanityUrl, { label: "Sanity", maxBytes: 64 * 1024, timeoutMs: 10_000 }),
    fetchJsonLimited(liveMarkerUrl, { label: "Release marker", maxBytes: 32 * 1024, timeoutMs: 10_000 }),
  ]);
  const result = evaluateMenuSync(sanityPayload, markerPayload);
  const output = process.env.GITHUB_OUTPUT;
  if (output) {
    appendFileSync(
      output,
      `changed=${result.changed}\ncms_revision=${result.cmsRevision}\nreason=${result.reason}\n`,
    );
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isCli) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
