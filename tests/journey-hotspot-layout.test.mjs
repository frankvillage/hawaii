import assert from "node:assert/strict";

import {
  intersects,
  isInside,
  resolveHotspotLayout,
  validateAuthoredCoordinate,
} from "../web/src/lib/journey-hotspot-layout.ts";

assert.equal(validateAuthoredCoordinate({ x: 50, y: 50 }), true);
assert.equal(validateAuthoredCoordinate({ x: -1, y: 50 }), false);
assert.equal(validateAuthoredCoordinate({ x: 50, y: 101 }), false);

for (const viewport of [
  { x: 0, y: 0, width: 768, height: 1024 },
  { x: 0, y: 0, width: 1024, height: 768 },
  { x: 0, y: 0, width: 1366, height: 768 },
  { x: 0, y: 0, width: 1920, height: 1080 },
]) {
  const obstacles = [
    { x: 0, y: 0, width: viewport.width, height: 100 },
    { x: 24, y: viewport.height - 280, width: 430, height: 250 },
  ];
  const results = resolveHotspotLayout({
    viewport,
    obstacles,
    hotspots: [
      { id: "one", anchor: { x: viewport.width * 0.3, y: viewport.height * 0.3 }, width: 210, height: 44 },
      { id: "two", anchor: { x: viewport.width * 0.32, y: viewport.height * 0.31 }, width: 230, height: 44 },
    ],
  });

  assert.equal(results.length, 2);
  for (const [index, result] of results.entries()) {
    assert.equal(isInside(result.rect, viewport), true, `${viewport.width}: ${result.id} overflowed`);
    assert.equal(obstacles.some((rect) => intersects(result.rect, rect, 8)), false);
    assert.equal(results.slice(0, index).some((other) => intersects(result.rect, other.rect, 8)), false);
  }
}

const compact = resolveHotspotLayout({
  viewport: { x: 0, y: 0, width: 160, height: 180 },
  obstacles: [{ x: 50, y: 0, width: 60, height: 180 }],
  hotspots: [
    { id: "one", anchor: { x: 80, y: 80 }, width: 240, height: 44 },
    { id: "two", anchor: { x: 80, y: 90 }, width: 240, height: 44 },
  ],
});
assert.ok(compact.every(({ mode, rect }) => mode === "compact" && rect.width === 44));
assert.equal(intersects(compact[0].rect, compact[1].rect, 8), false);

console.log("journey hotspot layout checks passed");
