export type JourneyRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type JourneyPoint = { x: number; y: number };

type HotspotGeometry = {
  id: string;
  anchor: JourneyPoint;
  width: number;
  height: number;
};

export type ResolvedHotspot = {
  id: string;
  anchor: JourneyPoint;
  mode: "label" | "compact";
  rect: JourneyRect;
};

const GAP = 8;
const ANCHOR_GAP = 16;
const COMPACT_SIZE = 44;

export function validateAuthoredCoordinate(point: JourneyPoint) {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 100 &&
    point.y >= 0 &&
    point.y <= 100
  );
}

export function intersects(a: JourneyRect, b: JourneyRect, gap = 0) {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  );
}

export function isInside(rect: JourneyRect, viewport: JourneyRect) {
  return (
    rect.x >= viewport.x &&
    rect.y >= viewport.y &&
    rect.x + rect.width <= viewport.x + viewport.width &&
    rect.y + rect.height <= viewport.y + viewport.height
  );
}

function candidateRects(hotspot: HotspotGeometry) {
  const shifts = [
    { x: 0, y: 0 },
    { x: 0, y: -24 },
    { x: 0, y: 24 },
    { x: -24, y: 0 },
    { x: 24, y: 0 },
  ];

  return shifts.flatMap((shift) => {
    const anchor = { x: hotspot.anchor.x + shift.x, y: hotspot.anchor.y + shift.y };
    return [
      {
        anchor,
        rect: {
          x: anchor.x + ANCHOR_GAP,
          y: anchor.y - hotspot.height / 2,
          width: hotspot.width,
          height: hotspot.height,
        },
      },
      {
        anchor,
        rect: {
          x: anchor.x - ANCHOR_GAP - hotspot.width,
          y: anchor.y - hotspot.height / 2,
          width: hotspot.width,
          height: hotspot.height,
        },
      },
      {
        anchor,
        rect: {
          x: anchor.x - hotspot.width / 2,
          y: anchor.y - ANCHOR_GAP - hotspot.height,
          width: hotspot.width,
          height: hotspot.height,
        },
      },
      {
        anchor,
        rect: {
          x: anchor.x - hotspot.width / 2,
          y: anchor.y + ANCHOR_GAP,
          width: hotspot.width,
          height: hotspot.height,
        },
      },
    ];
  });
}

function isAvailable(rect: JourneyRect, viewport: JourneyRect, blocked: JourneyRect[]) {
  return isInside(rect, viewport) && !blocked.some((item) => intersects(rect, item, GAP));
}

function compactLaneRect(index: number, viewport: JourneyRect, blocked: JourneyRect[]) {
  const positionsPerSide = Math.max(1, Math.floor((viewport.height - GAP) / (COMPACT_SIZE + GAP)));

  for (let offset = 0; offset < positionsPerSide * 2; offset += 1) {
    const position = index + offset;
    const rightSide = position >= positionsPerSide;
    const slot = position % positionsPerSide;
    const rect = {
      x: rightSide
        ? viewport.x + viewport.width - COMPACT_SIZE - GAP
        : viewport.x + GAP,
      y: viewport.y + GAP + slot * (COMPACT_SIZE + GAP),
      width: COMPACT_SIZE,
      height: COMPACT_SIZE,
    };
    if (isAvailable(rect, viewport, blocked)) return rect;
  }

  return {
    x: viewport.x + GAP,
    y: viewport.y + GAP + index * (COMPACT_SIZE + GAP),
    width: COMPACT_SIZE,
    height: COMPACT_SIZE,
  };
}

export function resolveHotspotLayout({
  viewport,
  obstacles,
  hotspots,
}: {
  viewport: JourneyRect;
  obstacles: JourneyRect[];
  hotspots: HotspotGeometry[];
}) {
  const resolved: ResolvedHotspot[] = [];

  for (const hotspot of hotspots) {
    const blocked = [...obstacles, ...resolved.map(({ rect }) => rect)];
    const candidate = candidateRects(hotspot).find(({ rect }) =>
      isAvailable(rect, viewport, blocked),
    );

    if (candidate) {
      resolved.push({ id: hotspot.id, anchor: candidate.anchor, mode: "label", rect: candidate.rect });
      continue;
    }

    const rect = compactLaneRect(resolved.length, viewport, blocked);
    resolved.push({
      id: hotspot.id,
      anchor: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
      mode: "compact",
      rect,
    });
  }

  return resolved;
}
