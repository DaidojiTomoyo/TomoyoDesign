type Point = [number, number, number];
type Surface = (u: number, v: number) => Point;

type LayoutRect = { x: number; y: number; width: number; height: number };
export type BloomLayout = {
  clearances: readonly LayoutRect[];
  surfaces?: readonly LayoutRect[];
  viewportHeight?: number;
};
type Box = { left: number; top: number; right: number; bottom: number };
type BranchPath = { points: Point[]; distances: number[]; length: number };

// CSS-pixel document coordinates: x right, y down, z toward the viewer.
// Position, normal, surface UV, material, local ambient occlusion.
export const BLOOM_VERTEX_STRIDE = 10;
const TAU = Math.PI * 2;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const phase = (p: number, a: number, b: number) => {
  const t = clamp((p - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const add = (a: Point, b: Point): Point => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
const mul = (a: Point, n: number): Point => [a[0] * n, a[1] * n, a[2] * n];
const cross = (a: Point, b: Point): Point => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (a: Point): Point => {
  const length = Math.hypot(...a);
  return length > 1e-9 ? mul(a, 1 / length) : [0, 0, 1];
};

const distance = (a: Point, b: Point) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const lerpPoint = (a: Point, b: Point, t: number): Point => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
];
function branchPath(points: Point[]): BranchPath {
  const distances = [0];
  for (let i = 1; i < points.length; i++)
    distances.push(distances[i - 1]! + distance(points[i - 1]!, points[i]!));
  return { points, distances, length: distances.at(-1)! };
}
function pathPoint(path: BranchPath, t: number): Point {
  const target = clamp(t) * path.length;
  let low = 1;
  let high = path.distances.length - 1;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (path.distances[middle]! < target) low = middle + 1;
    else high = middle;
  }
  const before = path.distances[low - 1]!;
  return lerpPoint(
    path.points[low - 1]!,
    path.points[low]!,
    (target - before) / (path.distances[low]! - before || 1),
  );
}
function cubic(a: Point, b: Point, c: Point, d: Point, count = 96) {
  return branchPath(
    Array.from({ length: count + 1 }, (_, i) => {
      const t = i / count;
      return lerpPoint(
        lerpPoint(lerpPoint(a, b, t), lerpPoint(b, c, t), t),
        lerpPoint(lerpPoint(b, c, t), lerpPoint(c, d, t), t),
        t,
      );
    }),
  );
}

// Shape-preserving cubic Hermite curves keep one continuous tangent through
// broad bends, including the near-vertical part of a hanging branch.
function woodyCurve(knots: [number, number][]) {
  const points = knots
    .sort((a, b) => a[0] - b[0])
    .filter((point, i, list) => i === 0 || point[0] - list[i - 1]![0] > 0.5);
  const slopes = points
    .slice(1)
    .map((point, i) => (point[1] - points[i]![1]) / (point[0] - points[i]![0]));
  const tangents = points.map((_, i) => {
    if (i === 0 || i === points.length - 1) return 0;
    const a = slopes[i - 1]!;
    const b = slopes[i]!;
    return a * b > 0 ? (2 * a * b) / (a + b) : 0;
  });
  return (y: number) => {
    if (y <= points[0]![0]) return points[0]![1];
    for (let i = 1; i < points.length; i++)
      if (y <= points[i]![0]) {
        const a = points[i - 1]!;
        const b = points[i]!;
        const length = b[0] - a[0];
        const t = (y - a[0]) / length;
        return (
          (2 * t ** 3 - 3 * t * t + 1) * a[1] +
          (t ** 3 - 2 * t * t + t) * length * tangents[i - 1]! +
          (-2 * t ** 3 + 3 * t * t) * b[1] +
          (t ** 3 - t * t) * length * tangents[i]!
        );
      }
    return points.at(-1)![1];
  };
}

type Axis = { radius: number; tip: number; rows: number };
// One cropped parent bough carries five unequal lateral branches. The main
// continuation stays at the page edge instead of threading text columns.
const axes: Axis[] = [
  { radius: 4.1, tip: 0.4, rows: 400 },
  { radius: 2.6, tip: 0.36, rows: 96 },
  { radius: 2.2, tip: 0.32, rows: 96 },
  { radius: 1.9, tip: 0.3, rows: 96 },
  { radius: 1.65, tip: 0.28, rows: 96 },
  { radius: 1.35, tip: 0.25, rows: 96 },
  { radius: 1.1, tip: 0.24, rows: 46 },
  { radius: 0.9, tip: 0.22, rows: 46 },
];
type Cluster = {
  axis: number;
  t: number;
  reach: Point;
  count: number;
  angle: number;
  local: boolean;
};
const clusterTemplates: Cluster[] = [
  {
    axis: 0,
    t: 0.047,
    reach: [28, -5, 9],
    count: 2,
    angle: -0.25,
    local: true,
  },
  {
    axis: 0,
    t: 0.055,
    reach: [64, -24, 14],
    count: 2,
    angle: 1.6,
    local: true,
  },
  ...Array.from({ length: 20 }, (_, i): Cluster => ({
    axis:
      i === 2 || i === 3 ? 6 : i === 14 || i === 15 ? 7 : 1 + Math.floor(i / 4),
    t: [
      [0.2, 0.84, 0.36, 0.86],
      [0.16, 0.36, 0.73, 0.9],
      [0.24, 0.37, 0.68, 0.88],
      [0.17, 0.86, 0.42, 0.91],
      [0.21, 0.41, 0.69, 0.85],
    ][Math.floor(i / 4)]![i % 4]!,
    reach: [
      [12, 11, 14],
      [-7, 21, 8],
      [16, 14, 20],
      [-10, 17, 12],
    ][i % 4]! as Point,
    count: 3,
    angle: [0.4, 2.2, -0.35, 1.7][i % 4]! + Math.floor(i / 4) * 0.19,
    local: true,
  })),
];
type Timing = number | (() => number);
const resolveTiming = (timing: Timing) =>
  typeof timing === "function" ? timing() : timing;

type Patch = {
  rows: number;
  columns: number;
  offset: number;
  surface: Surface;
  material: number;
  tube: boolean;
  positions: Float32Array;
  start: Timing;
  end: Timing;
};

export function createBloomGeometry() {
  const clusters = clusterTemplates.map((cluster) => ({
    ...cluster,
    reach: [...cluster.reach] as Point,
  }));
  const patches: Patch[] = [];
  const indices: number[] = [];
  const prepare: (() => void)[] = [];
  let count = 0;
  let p = 0;
  let revision = 0;
  let documentHeight = 4200;
  let activeStart: Timing = -1;
  let activeEnd: Timing = 2;
  let viewportHeight = 720;
  let scrollRange = 3480;
  let worldScale = 1;
  let axisStarts = axes.map(() => 0);
  let axisEnds = axes.map(() => 1);
  let parentAnchors = axes.map(() => 0);
  const parents = [-1, 0, 0, 0, 0, 0, 1, 4];
  const timings: (() => void)[] = [];
  const floweringWindows: {
    cluster: number;
    start: number;
    end: number;
    y: number;
    closed: boolean;
  }[] = [];
  let axisPaths: BranchPath[] = [];
  let spurPaths: BranchPath[] = [];
  let clearanceBoxes: Box[] = [];

  function axisPoint(index: number, t: number): Point {
    return pathPoint(axisPaths[index]!, t);
  }
  const atY = (path: BranchPath, y: number) => {
    let lo = 0,
      hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (pathPoint(path, mid)[1] < y) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const nodeBirth = (index: number, t: number) =>
    index === 0
      ? (axisPoint(index, t)[1] * worldScale - viewportHeight * 0.82) /
        scrollRange
      : mix(axisStarts[index]!, axisEnds[index]!, t);
  const axisGrowth = (index: number) =>
    index === 0
      ? atY(
          axisPaths[0]!,
          (p * scrollRange + viewportHeight * 0.82) / worldScale,
        )
      : clamp(
          (p - axisStarts[index]!) / (axisEnds[index]! - axisStarts[index]!),
        );

  function rebuildPaths(scale: number, width: number, layout?: BloomLayout) {
    worldScale = scale;
    viewportHeight =
      Number.isFinite(layout?.viewportHeight) && layout!.viewportHeight! > 0
        ? layout!.viewportHeight!
        : 720;
    scrollRange = Math.max(1, documentHeight * scale - viewportHeight);
    const convert = (rects: readonly LayoutRect[]) =>
      rects
        .filter(
          (rect) =>
            [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) &&
            rect.width > 0 &&
            rect.height > 0,
        )
        .map((rect) => ({
          left: rect.x / scale,
          top: rect.y / scale,
          right: (rect.x + rect.width) / scale,
          bottom: (rect.y + rect.height) / scale,
        }));
    const boxes = convert(layout?.clearances ?? []);
    const surfaces = convert(layout?.surfaces ?? []);
    clearanceBoxes = boxes;
    const pageWidth = width / scale;
    const left =
      boxes.find(
        (box) =>
          box.top > 90 / scale &&
          box.top < documentHeight * 0.15 &&
          box.bottom - box.top > 100 / scale,
      )?.left ?? Math.max(56, (width - 1328) / 2) / scale;
    const headings = boxes
      .filter(
        (box) =>
          Math.abs(box.left - left) < 3 / scale &&
          box.top > documentHeight * 0.15 &&
          box.bottom - box.top >= 30 / scale &&
          box.bottom - box.top <= 70 / scale,
      )
      .sort((a, b) => a.top - b.top);
    const metal = headings[0] ?? {
      top: documentHeight * 0.207,
      bottom: documentHeight * 0.22,
    };
    const gallery = headings[1] ?? {
      top: documentHeight * 0.375,
      bottom: documentHeight * 0.386,
    };
    const focus = headings[2] ?? {
      top: documentHeight * 0.56,
      bottom: documentHeight * 0.573,
    };
    const workflow = headings[3] ?? {
      top: documentHeight * 0.79,
      bottom: documentHeight * 0.802,
    };
    const heroBottom = Math.max(
      documentHeight * 0.12,
      ...boxes
        .filter(
          (box) =>
            box.top > 90 / scale &&
            box.top < metal.top * 0.7 &&
            box.bottom - box.top > 100 / scale,
        )
        .map((box) => box.bottom),
    );
    const metalBottom =
      surfaces.find((box) => box.top > metal.bottom && box.top < gallery.top)
        ?.bottom ?? gallery.top - 110 / scale;
    const captionBefore = (from: number, to: number, fallback: number) =>
      Math.max(
        fallback,
        ...boxes
          .filter(
            (box) =>
              box.top > from &&
              box.bottom < to &&
              box.bottom - box.top < 35 / scale,
          )
          .map((box) => box.bottom),
      );
    const galleryBottom = captionBefore(
      gallery.bottom,
      focus.top - 80 / scale,
      focus.top - 183 / scale,
    );
    const focusBottom = captionBefore(
      focus.bottom,
      workflow.top - 80 / scale,
      workflow.top - 170 / scale,
    );
    const steps = boxes.filter(
      (box) =>
        box.top > workflow.bottom &&
        box.top < workflow.bottom + 200 / scale &&
        box.bottom - box.top > 65 / scale &&
        box.bottom - box.top < 110 / scale,
    );
    const stepBottom = Math.max(
      workflow.bottom + 125 / scale,
      ...steps.map((box) => box.bottom),
    );
    const cta = boxes.find(
      (box) =>
        box.top > stepBottom &&
        box.top < documentHeight * 0.92 &&
        box.bottom - box.top > 65 / scale &&
        box.right - box.left > 400 / scale,
    );
    const bands = [
      { low: heroBottom + 18 / scale, high: metal.top - 15 / scale },
      { low: metalBottom + 8 / scale, high: gallery.top - 12 / scale },
      { low: galleryBottom + 15 / scale, high: focus.top - 12 / scale },
      { low: focusBottom + 15 / scale, high: workflow.top - 12 / scale },
      {
        low: stepBottom + 15 / scale,
        high: (cta?.top ?? documentHeight * 0.87) - 12 / scale,
      },
    ];
    const wideMargin = left > 130 / scale;
    const nodeYs = bands.map(
      (band) => band.low + Math.min(24, (band.high - band.low) * 0.18),
    );
    // A hanging bough makes a few oblique excursions from beyond the frame.
    // The wider desktop margin must not expose a page-height vertical support.
    const peak = Math.min(left - 16 / scale, 180);
    const knots: [number, number][] = [
      [-documentHeight * 0.018, -68],
      [72 / scale, 24 / scale],
      [118 / scale, 32 / scale],
      [200 / scale, -38],
      [heroBottom * 0.7, -100],
    ];
    for (let i = 0; i < nodeYs.length; i++) {
      const y = nodeYs[i]!;
      const previous = nodeYs[i - 1] ?? heroBottom * 0.7;
      const next = nodeYs[i + 1] ?? bands[4]!.high;
      knots.push(
        [y - Math.min(170 / scale, (y - previous) * 0.3), -110 - i * 7],
        [
          y + (i === 4 ? 25 : 45) / scale,
          peak * [0.8, 1, 0.72, 0.88, 0.64][i]!,
        ],
        [y + Math.min(190 / scale, (next - y) * 0.7), -120 + i * 9],
      );
    }
    knots.push([bands[4]!.high - 10 / scale, -70]);
    // Preserve the accepted side-branch attachment points while spreading each
    // return over an unequal pair of shoulders. A single sampled extremum made
    // the thick parent look like a pointed elbow at broad desktop widths.
    const attachmentCurve = woodyCurve([...knots]);
    const attachmentKnots = nodeYs.map((y): [number, number] => [
      y,
      attachmentCurve(y),
    ]);
    const shoulderBefore = [28, 16, 40, 22, 8];
    const shoulderAfter = [55, 34, 25, 44, 16];
    const roundedKnots = knots.flatMap((point): [number, number][] => {
      const index = nodeYs.findIndex(
        (y, i) => Math.abs(point[0] - y - (i === 4 ? 25 : 45) / scale) < 0.001,
      );
      if (index < 0) return [point];
      return [
        [
          point[0] - shoulderBefore[index]! / scale,
          point[1] - [10, 18, 8, 14, 4][index]! / scale,
        ],
        point,
        [
          point[0] + shoulderAfter[index]! / scale,
          point[1] - [15, 22, 8, 18, 8][index]! / scale,
        ],
      ];
    });
    const curve = woodyCurve([...roundedKnots, ...attachmentKnots]);
    const y0 = knots[0]![0],
      y1 = knots.at(-1)![0];
    axisPaths = [
      branchPath(
        Array.from({ length: 881 }, (_, i): Point => {
          const t = i / 880,
            y = mix(y0, y1, t);
          return [
            curve(y) + Math.sin(t * 51.7) * Math.sin(Math.PI * t) * 0.75,
            y,
            -10 + Math.sin(t * 8.1) * 8,
          ];
        }),
      ),
    ];
    clusters[0]!.t = atY(axisPaths[0]!, 100 / scale);
    clusters[1]!.t = atY(axisPaths[0]!, 118 / scale);
    parentAnchors = [0];
    const reaches = [340, 195, 255, 245, 185];
    const pockets = bands.map((band) => ({ ...band }));
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i]!,
        anchor = atY(axisPaths[0]!, nodeYs[i]!);
      parentAnchors.push(anchor);
      const root = axisPoint(0, anchor);
      const reach = Math.min(
        reaches[i]! + (i === 0 ? Math.max(0, left - 70) * 0.5 : 0),
        pageWidth * 0.53,
      );
      const tip: Point = [root[0] + reach, band.high - 62 / scale, 6 + i * 3];
      const first: Point = [
        root[0] + reach * 0.18,
        root[1] + Math.min(36, (band.high - band.low) * 0.24),
        root[2] + 6,
      ];
      const second: Point = [
        tip[0] - reach * (0.22 + i * 0.015),
        tip[1] - (i === 0 ? 40 : 12) / scale,
        tip[2] - 9,
      ];
      if (wideMargin && (i === 1 || i === 3)) {
        // In a broad margin, two generations can hang diagonally alongside
        // their section instead of repeating another horizontal flower shelf.
        const drop = (i === 1 ? 210 : 180) / scale;
        const end: Point = [
          Math.max(35 / scale, root[0] - (i === 1 ? 75 : 92) / scale),
          root[1] + drop,
          root[2] + 15,
        ];
        const entrance: Point = [
          root[0] + 18 / scale,
          root[1] + 44 / scale,
          root[2] + 4,
        ];
        const bend: Point = [
          end[0] + (i === 1 ? 62 : 24) / scale,
          end[1] - 62 / scale,
          end[2] - 8,
        ];
        axisPaths.push(cubic(root, entrance, bend, end));
        pockets[i] = { low: band.low, high: end[1] + 62 / scale };
      } else if (i === 0) {
        const joint: Point = [
          root[0] + reach * 0.63,
          root[1] + 48 / scale,
          root[2] + 8,
        ];
        const tangent: Point = [42, 12, 3];
        const entrance = cubic(
          root,
          add(root, [65, 8, 3]),
          add(joint, mul(tangent, -1)),
          joint,
          48,
        );
        const ending = cubic(joint, add(joint, tangent), second, tip, 48);
        axisPaths.push(
          branchPath([...entrance.points, ...ending.points.slice(1)]),
        );
      } else axisPaths.push(cubic(root, first, second, tip));
    }
    for (const [parent, anchor, bandIndex] of [
      [1, 0.49, 0],
      [4, 0.53, 3],
    ]) {
      parentAnchors.push(anchor!);
      const root = axisPoint(parent!, anchor!);
      const band = pockets[bandIndex!]!;
      const first =
        parent === 1
          ? add(root, [20 / scale, -5 / scale, 4])
          : add(root, [(wideMargin ? 14 : -4) / scale, 12 / scale, 4]);
      const tip: Point =
        parent === 1
          ? [
              root[0] + 38 / scale,
              Math.max(root[1] - 40 / scale, band.low + 30 / scale),
              root[2] + 17,
            ]
          : [
              root[0] + (wideMargin ? 45 : -34) / scale,
              Math.min(root[1] + 48 / scale, band.high - 48 / scale),
              root[2] + 17,
            ];
      const second: Point = [
        tip[0] - 12 / scale,
        tip[1] + (parent === 1 ? 7 : -24) / scale,
        tip[2] - 7,
      ];
      axisPaths.push(cubic(root, first, second, tip, 64));
    }
    axisStarts = [-1];
    axisEnds = [1];
    for (let index = 1; index < axes.length; index++) {
      axisStarts[index] = nodeBirth(parents[index]!, parentAnchors[index]!);
      axisEnds[index] = Math.max(
        axisStarts[index]! +
          (index === 6 ? 30 : index === 7 ? 65 : 130) / scrollRange,
        (axisPoint(index, 1)[1] * scale - viewportHeight * 0.66) / scrollRange,
      );
    }
    spurPaths = clusters.map((cluster, index) => {
      const root = axisPoint(cluster.axis, cluster.t);
      const target = add(root, cluster.reach);
      const band =
        cluster.axis === 0
          ? { low: 72 / scale, high: 139 / scale }
          : pockets[
              (cluster.axis === 6 ? 1 : cluster.axis === 7 ? 4 : cluster.axis) -
                1
            ]!;
      let low = Infinity,
        high = -Infinity,
        right = -Infinity,
        leftBound = Infinity;
      for (let n = 0; n < cluster.count; n++) {
        const radius = 18 + ((index * 7 + n * 11) % 12);
        const angle = cluster.angle + n * 2.32;
        const length = 19 + ((index * 13 + n * 9) % 16);
        const y = 8 + Math.sin(angle) * length * 0.58 + n * 4;
        low = Math.min(low, y - radius * 1.13);
        high = Math.max(high, y + radius * 1.13);
        right = Math.max(right, Math.cos(angle) * length + radius * 1.13);
        leftBound = Math.min(
          leftBound,
          Math.cos(angle) * length - radius * 1.13,
        );
      }
      if (band)
        target[1] = Math.max(
          band.low - low + 3 / scale,
          Math.min(band.high - high - 3 / scale, target[1]),
        );
      // Move a complete small cluster within its own pocket; never reroute a
      // branch through obstacle corners or cut individual petals out of text.
      const fits = (x: number, y: number) =>
        [...boxes, ...surfaces].every(
          (box) =>
            x + right < box.left - 5 / scale ||
            x + leftBound > box.right + 5 / scale ||
            y + high < box.top - 5 / scale ||
            y + low > box.bottom + 5 / scale,
        );
      if (!fits(target[0], target[1])) {
        let best = Infinity;
        const original = [...target] as Point;
        for (const dx of [0, -12, 12, -24, 24, -40, 40, -64, 64])
          for (const dy of [0, -8, 8, -16, 16, -28, 28, -44, 44]) {
            const x = original[0] + dx / scale,
              y = original[1] + dy / scale;
            if (band && (y + low < band.low || y + high > band.high)) continue;
            const cost = dx * dx + dy * dy;
            if (cost < best && fits(x, y)) {
              best = cost;
              target[0] = x;
              target[1] = y;
            }
          }
      }
      const before = axisPoint(cluster.axis, Math.max(0, cluster.t - 0.003));
      const after = axisPoint(cluster.axis, Math.min(1, cluster.t + 0.003));
      const tangent = normalize([
        after[0] - before[0],
        after[1] - before[1],
        after[2] - before[2],
      ]);
      const first = add(
        root,
        mul(tangent, Math.min(14, distance(root, target) * 0.25)),
      );
      const second = lerpPoint(root, target, 0.72);
      second[2] -= 4;
      return cubic(root, first, second, target, 32);
    });
    for (const timing of timings) timing();
  }

  function patch(
    rows: number,
    columns: number,
    material: number,
    surface: Surface,
    tube = false,
  ) {
    const offset = count;
    count += (rows + 1) * (columns + 1);
    patches.push({
      rows,
      columns,
      offset,
      surface,
      material,
      tube,
      start: activeStart,
      end: activeEnd,
      positions: new Float32Array((rows + 1) * (columns + 1) * 3),
    });
    for (let u = 0; u < rows; u++)
      for (let v = 0; v < columns; v++) {
        const a = offset + u * (columns + 1) + v;
        const b = a + columns + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
  }
  function tube(
    rows: number,
    columns: number,
    material: number,
    curve: (u: number) => Point,
    radius: (u: number) => number,
  ) {
    let lastU = -1;
    let lastRevision = -1;
    let center: Point = [0, 0, 0];
    let x: Point = [1, 0, 0];
    let y: Point = [0, 1, 0];
    let r = 0;
    patch(
      rows,
      columns,
      material,
      (u, v) => {
        if (u !== lastU || revision !== lastRevision) {
          center = curve(u);
          const before = curve(Math.max(0, u - 0.001));
          const after = curve(Math.min(1, u + 0.001));
          const tangent = normalize([
            after[0] - before[0],
            after[1] - before[1],
            after[2] - before[2],
          ]);
          x = normalize(
            cross(tangent, Math.abs(tangent[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]),
          );
          y = cross(tangent, x);
          r = radius(u);
          lastU = u;
          lastRevision = revision;
        }
        const angle = v * TAU;
        return add(
          center,
          add(mul(x, Math.cos(angle) * r), mul(y, Math.sin(angle) * r)),
        );
      },
      true,
    );
  }
  function ellipsoid(
    material: number,
    center: () => Point,
    radii: () => Point,
    rows = 6,
    columns = 8,
  ) {
    patch(
      rows,
      columns,
      material,
      (u, v) => {
        const r = radii();
        const lat = u * Math.PI;
        const lon = v * TAU;
        return add(center(), [
          r[0] * Math.sin(lat) * Math.cos(lon),
          r[1] * Math.cos(lat),
          r[2] * Math.sin(lat) * Math.sin(lon),
        ]);
      },
      true,
    );
  }

  axes.forEach((axis, index) => {
    activeStart = () => axisStarts[index]!;
    activeEnd = () => axisEnds[index]!;
    const rows = axis.rows;
    tube(
      rows,
      index >= 4 ? 6 : 8,
      1,
      (u) => axisPoint(index, Math.min(u, axisGrowth(index))),
      (u) => {
        const growth = axisGrowth(index);
        // Already grown rings retain exactly their positions and thickness. Only
        // the newest ring tapers to the advancing tip; future rings have no area.
        if (growth === 0 || u > growth) return 0;
        const tip = clamp((growth - u) * rows);
        const taper = mix(axis.radius, axis.tip, Math.pow(u, 0.78));
        const collars = clusters.reduce(
          (sum, cluster) =>
            cluster.axis === index
              ? sum + 0.24 * Math.exp(-(((u - cluster.t) / 0.0065) ** 2))
              : sum,
          0,
        );
        const nodes =
          1 +
          collars +
          0.075 * Math.sin(u * 37 + index) +
          0.045 * Math.sin(u * 103 + index);
        return taper * nodes * tip;
      },
    );
    ellipsoid(
      6,
      () => add(axisPoint(index, axisGrowth(index)), [1, 4.4, 0]),
      () => {
        const grow = phase(axisGrowth(index), 0, 0.035);
        return [2.5 * grow, 5 * grow, 2.3 * grow];
      },
      5,
      6,
    );
  });

  clusters.forEach((cluster, clusterIndex) => {
    let birth = 0,
      spurEnd = 0;
    timings.push(() => {
      birth = nodeBirth(cluster.axis, cluster.t);
      spurEnd = birth + 34 / scrollRange;
    });
    let root: Point = [0, 0, 0];
    let node: Point = [0, 0, 0];
    let spurGrowth = 0;
    prepare.push(() => {
      root = axisPoint(cluster.axis, cluster.t);
      spurGrowth = phase(p, birth, spurEnd);
      node = pathPoint(spurPaths[clusterIndex]!, spurGrowth);
    });
    activeStart = () => birth;
    activeEnd = () => spurEnd;
    tube(
      18,
      6,
      1,
      (u) => {
        return pathPoint(spurPaths[clusterIndex]!, Math.min(u, spurGrowth));
      },
      (u) =>
        u <= spurGrowth ? (1.25 - u * 0.88) * clamp((spurGrowth - u) * 18) : 0,
    );
    ellipsoid(
      1,
      () => root,
      () => [2.2 * spurGrowth, 3.3 * spurGrowth, 2 * spurGrowth],
      4,
      6,
    );

    if (cluster.local && (clusterIndex % 2 === 0 || clusterIndex === 21)) {
      let budRoot: Point = [0, 0, 0];
      let budTip: Point = [0, 0, 0];
      let twigGrowth = 0;
      prepare.push(() => {
        const path = spurPaths[clusterIndex]!;
        budRoot = pathPoint(path, 0.52);
        const next = pathPoint(path, 0.69);
        const direction = normalize([
          next[0] - budRoot[0],
          next[1] - budRoot[1],
          next[2] - budRoot[2],
        ]);
        twigGrowth = phase(
          p,
          birth + 20 / scrollRange,
          birth + 55 / scrollRange,
        );
        const side = clusterIndex % 4 === 0 ? 1 : -1;
        budTip = add(budRoot, [
          (direction[0] * 17 - direction[1] * side * 6) * twigGrowth,
          (direction[1] * 17 + direction[0] * side * 6) * twigGrowth,
          (direction[2] * 17 + 3) * twigGrowth,
        ]);
      });
      activeStart = () => birth + 20 / scrollRange;
      activeEnd = () => birth + 55 / scrollRange;
      tube(
        5,
        4,
        5,
        (u) => lerpPoint(budRoot, budTip, u),
        (u) => (0.72 - u * 0.35) * twigGrowth,
      );
      ellipsoid(
        6,
        () => budTip,
        () => [2.9 * twigGrowth, 4.7 * twigGrowth, 2.7 * twigGrowth],
        4,
        6,
      );
    }

    for (let n = 0; n < cluster.count; n++) {
      // A retained bud or half-open flower accompanies each three clusters.
      const last = n === cluster.count - 1;
      const closed = last && clusterIndex % 3 === 0;
      const half = last && clusterIndex % 3 === 1;
      const radius = 18 + ((clusterIndex * 7 + n * 11) % 12);
      const angle = cluster.angle + n * 2.32;
      const stalkLength = 19 + ((clusterIndex * 13 + n * 9) % 16);
      const offset: Point = [
        Math.cos(angle) * stalkLength,
        8 + Math.sin(angle) * stalkLength * 0.58 + n * 4,
        9 + n * 5,
      ];
      const normal = normalize([
        Math.sin(clusterIndex * 1.7 + n * 2.4) * 0.72,
        Math.cos(clusterIndex * 0.9 + n * 2.7) * 0.54,
        0.58 + ((clusterIndex + n) % 4) * 0.14,
      ]);
      const bx = normalize(cross([0, 1, 0], normal));
      const by = cross(normal, bx);
      const rotation = clusterIndex * 0.73 + n * 1.39;
      const window = { cluster: clusterIndex, start: 0, end: 0, y: 0, closed };
      floweringWindows.push(window);
      let stalkStart = 0,
        budStart = 0,
        openStart = 0,
        openEnd = 0;
      timings.push(() => {
        stalkStart = spurEnd - 8 / scrollRange + (n * 5) / scrollRange;
        budStart = stalkStart + 18 / scrollRange;
        const centerY =
          (pathPoint(spurPaths[clusterIndex]!, 1)[1] + offset[1]) * worldScale;
        openStart =
          Math.max(
            budStart + 15 / scrollRange,
            (centerY - viewportHeight * 0.66) / scrollRange,
          ) +
          (n * 5) / scrollRange;
        openEnd = openStart + 105 / scrollRange;
        Object.assign(window, { start: openStart, end: openEnd, y: centerY });
      });
      let center: Point = [0, 0, 0];
      let stalkGrowth = 0;
      let budGrowth = 0;
      let opening = 0;
      let stamenGrowth = 0;
      const local = (x: number, y: number, z: number): Point => [
        center[0] + bx[0] * x + by[0] * y + normal[0] * z,
        center[1] + bx[1] * x + by[1] * y + normal[1] * z,
        center[2] + bx[2] * x + by[2] * y + normal[2] * z,
      ];
      prepare.push(() => {
        stalkGrowth = phase(p, stalkStart, stalkStart + 27 / scrollRange);
        center = add(node, [
          offset[0] * stalkGrowth,
          offset[1] * stalkGrowth + Math.sin(stalkGrowth * Math.PI) * 4,
          offset[2] * stalkGrowth,
        ]);
        budGrowth = phase(p, budStart, budStart + 22 / scrollRange);
        opening = closed ? 0 : phase(p, openStart, openEnd) * (half ? 0.47 : 1);
        stamenGrowth = phase(opening, 0.24, 0.82) * budGrowth;
      });
      activeStart = () => birth;
      activeEnd = () => stalkStart + 27 / scrollRange;
      tube(
        5,
        4,
        5,
        (u) => {
          const t = Math.min(u, stalkGrowth);
          return add(node, [
            offset[0] * t,
            offset[1] * t + Math.sin(t * Math.PI) * 4,
            offset[2] * t,
          ]);
        },
        (u) =>
          u <= stalkGrowth
            ? (0.83 - u * 0.31) * clamp((stalkGrowth - u) * 5)
            : 0,
      );
      activeEnd = () =>
        Math.max(openEnd + 12 / scrollRange, budStart + 22 / scrollRange);

      // The red-brown hypanthium and five pointed sepals sit behind the petals.
      patch(
        4,
        6,
        5,
        (u, v) => {
          const lat = u * Math.PI;
          const r = radius * 0.105 * Math.sin(lat) * budGrowth;
          return local(
            r * Math.cos(v * TAU),
            r * Math.sin(v * TAU),
            (-2.3 + radius * 0.085 * Math.cos(lat)) * budGrowth,
          );
        },
        true,
      );
      for (let sepal = 0; sepal < 5; sepal++) {
        const a = rotation + ((sepal + 0.5) * TAU) / 5;
        patch(3, 2, 5, (u, v) => {
          const s = v * 2 - 1;
          const w = Math.sin(u * Math.PI) * 1.7 * s * budGrowth;
          const r = (2 + u * mix(1.4, 7, opening)) * budGrowth;
          const z = (-2.5 + u * mix(8.5, -3.0, opening)) * budGrowth;
          return local(
            Math.cos(a) * r - Math.sin(a) * w,
            Math.sin(a) * r + Math.cos(a) * w,
            z,
          );
        });
      }
      // Closed buds remain visible at maturity; opening buds fold away only
      // after their corollas have enough area to cover the shell.
      patch(
        5,
        7,
        6,
        (u, v) => {
          const shell = 1 - phase(opening, 0.04, 0.55);
          const lat = u * Math.PI;
          const r =
            radius *
            0.2 *
            Math.sin(lat) *
            (1 - 0.12 * Math.cos(lat)) *
            budGrowth *
            shell;
          return local(
            r * Math.cos(v * TAU),
            r * Math.sin(v * TAU),
            (radius * 0.14 + radius * 0.25 * Math.cos(lat)) * budGrowth * shell,
          );
        },
        true,
      );
      if (closed) continue;

      for (let petal = 0; petal < 5; petal++) {
        const a =
          rotation +
          (petal * TAU) / 5 +
          Math.sin(petal * 2.6 + clusterIndex) * 0.045;
        const length =
          radius * (1 + Math.sin(petal * 3.4 + n + clusterIndex) * 0.065);
        patch(8, 8, 0, (u, v) => {
          const s = v * 2 - 1;
          const unfurl = closed
            ? 0
            : phase(
                p,
                openStart + (petal * 2) / scrollRange,
                openEnd + (petal * 2) / scrollRange,
              ) * (half ? 0.47 : 1);
          const lip =
            (0.68 + 0.32 * Math.cos((s * Math.PI) / 2)) *
            (1 - 0.065 * Math.exp(-s * s * 90) * Math.pow(u, 6));
          const theta =
            a +
            s * (0.57 + Math.sin(u * Math.PI) * 0.1) +
            Math.sin(petal + n) * u * u * 0.025;
          const closedRadius =
            Math.pow(Math.sin(u * Math.PI), 0.8) * radius * 0.16;
          const r = mix(closedRadius, length * u * lip, unfurl) * budGrowth;
          const foldedZ = radius * (u * 0.38 + Math.sin(u * Math.PI) * 0.018);
          // Thin, shallow cups with softly lifted margins. The mesh carries
          // only macroscopic curvature; fine veins belong to the petal texture.
          const bowl = 0.1 * u * u - 0.038 * Math.pow(u, 5);
          const edge =
            (s * s * 0.052 + s * Math.sin(petal * 1.9 + n) * 0.026) * u * u;
          const tip = Math.sin(s * 4.8 + petal) * 0.012 * Math.pow(u, 5);
          const z =
            mix(
              foldedZ,
              length * (bowl + edge + tip) + petal * 0.12 * u,
              unfurl,
            ) * budGrowth;
          return local(Math.cos(theta) * r, Math.sin(theta) * r, z);
        });
      }

      // Fine ivory filaments and small warm anthers remain inside closed buds.
      for (let stamen = 0; stamen < 11; stamen++) {
        const a = stamen * 2.39996 + rotation;
        const reach = radius * (0.17 + (stamen % 4) * 0.029);
        const height = radius * (0.17 + (stamen % 5) * 0.018);
        const point = (u: number) =>
          local(
            Math.cos(a) * reach * u * u * stamenGrowth,
            Math.sin(a) * reach * u * u * stamenGrowth,
            (1.6 + height * u) * stamenGrowth,
          );
        tube(2, 3, 3, point, () => 0.2 * stamenGrowth);
        ellipsoid(
          4,
          () => point(1),
          () => [0.66 * stamenGrowth, 0.49 * stamenGrowth, 0.52 * stamenGrowth],
          2,
          4,
        );
      }
      ellipsoid(
        3,
        () => local(0, 0, 1.1 * stamenGrowth),
        () => [
          radius * 0.055 * stamenGrowth,
          radius * 0.055 * stamenGrowth,
          0.9 * stamenGrowth,
        ],
        3,
        5,
      );
    }
  });

  // Only a few young leaves have emerged among the flowering wood.
  for (const leaf of [
    { axis: 1, t: 0.55, angle: 0.9, length: 26 },
    { axis: 2, t: 0.8, angle: 2.3, length: 22 },
    { axis: 3, t: 0.51, angle: 1.2, length: 25 },
    { axis: 4, t: 0.73, angle: 2.1, length: 28 },
    { axis: 5, t: 0.57, angle: 1.1, length: 22 },
  ]) {
    let birth = 0;
    timings.push(() => {
      birth = nodeBirth(leaf.axis, leaf.t) + 65 / scrollRange;
    });
    let root: Point = [0, 0, 0];
    let growth = 0;
    let leafAngle = leaf.angle;
    prepare.push(() => {
      root = axisPoint(leaf.axis, leaf.t);
      growth = phase(p, birth, birth + 110 / scrollRange);
      leafAngle = leaf.angle;
      // A young leaf may turn around its genuine node to face the open side of
      // the branch. It remains one rigid blade, never a clipped text cutout.
      for (const turn of [0, 0.65, -0.65, 1.3, -1.3, Math.PI]) {
        const angle = leaf.angle + turn;
        const endX = root[0] + Math.cos(angle) * leaf.length;
        const endY = root[1] + Math.sin(angle) * leaf.length;
        const spread = leaf.length * 0.24;
        const box = {
          left: Math.min(root[0], endX) - spread,
          right: Math.max(root[0], endX) + spread,
          top: Math.min(root[1], endY) - spread,
          bottom: Math.max(root[1], endY) + spread,
        };
        if (
          clearanceBoxes.every(
            (rect) =>
              box.right < rect.left ||
              box.left > rect.right ||
              box.bottom < rect.top ||
              box.top > rect.bottom,
          )
        ) {
          leafAngle = angle;
          break;
        }
      }
    });
    activeStart = () => birth;
    activeEnd = () => birth + 110 / scrollRange;
    patch(12, 6, 2, (u, v) => {
      const s = v * 2 - 1;
      const width =
        Math.pow(Math.sin(u * Math.PI), 0.9) * leaf.length * 0.23 * s * growth;
      const length = u * leaf.length * growth;
      return add(root, [
        Math.cos(leafAngle) * length - Math.sin(leafAngle) * width,
        Math.sin(leafAngle) * length + Math.cos(leafAngle) * width,
        (Math.sin(u * Math.PI) * 7 - Math.abs(width) * 0.4 + u * 3) * growth,
      ]);
    });
  }

  if (count > 65535)
    throw new RangeError("Sakura geometry exceeds the WebGL 1 index budget");
  const vertices = new Float32Array(count * BLOOM_VERTEX_STRIDE);
  for (const part of patches)
    for (let u = 0; u <= part.rows; u++)
      for (let v = 0; v <= part.columns; v++) {
        const at =
          (part.offset + u * (part.columns + 1) + v) * BLOOM_VERTEX_STRIDE;
        vertices[at + 6] = u / part.rows;
        vertices[at + 7] = v / part.columns;
        vertices[at + 8] = part.material;
        vertices[at + 9] =
          part.material === 0 ? mix(0.94, 1, phase(u / part.rows, 0, 0.4)) : 1;
      }
  let previousP = NaN;
  let previousWidth = NaN;
  let previousHeight = NaN;
  let previousLayout: BloomLayout | undefined;
  let previousLayoutKey = "";

  function update(
    progress: number,
    pageWidth = 1440,
    pageHeight = 4200,
    layout?: BloomLayout,
  ) {
    p = clamp(Number.isFinite(progress) ? progress : 0);
    const width =
      Number.isFinite(pageWidth) && pageWidth > 0 ? pageWidth : 1440;
    const height =
      Number.isFinite(pageHeight) && pageHeight > 0 ? pageHeight : 4200;
    const layoutKey =
      layout === previousLayout
        ? previousLayoutKey
        : JSON.stringify(layout ?? {});
    const layoutChanged = layoutKey !== previousLayoutKey;
    if (
      p === previousP &&
      width === previousWidth &&
      height === previousHeight &&
      !layoutChanged
    )
      return;
    const scale = Math.max(0.78, Math.min(1.22, width / 1440));
    documentHeight = height / scale;
    const resized =
      width !== previousWidth || height !== previousHeight || layoutChanged;
    if (resized) rebuildPaths(scale, width, layout);
    revision++;
    for (const stage of prepare) stage();
    for (const part of patches) {
      // Settled flowers/wood do not consume CPU on subsequent scroll frames.
      if (
        !resized &&
        ((p <= resolveTiming(part.start) &&
          previousP <= resolveTiming(part.start)) ||
          (p >= resolveTiming(part.end) &&
            previousP >= resolveTiming(part.end)))
      )
        continue;
      const { rows, columns, positions, offset, surface, tube: isTube } = part;
      const rowSize = columns + 1;
      for (let u = 0; u <= rows; u++)
        for (let v = 0; v <= columns; v++) {
          const at = (u * rowSize + v) * 3;
          const point = surface(u / rows, v / columns);
          positions[at] = point[0] * scale;
          positions[at + 1] = point[1] * scale;
          positions[at + 2] = point[2] * scale;
        }
      for (let u = 0; u <= rows; u++)
        for (let v = 0; v <= columns; v++) {
          const i = u * rowSize + v;
          const beforeU = (Math.max(0, u - 1) * rowSize + v) * 3;
          const afterU = (Math.min(rows, u + 1) * rowSize + v) * 3;
          const beforeV =
            (u * rowSize +
              (isTube && v === 0 ? columns - 1 : Math.max(0, v - 1))) *
            3;
          const afterV =
            (u * rowSize +
              (isTube && v === columns ? 1 : Math.min(columns, v + 1))) *
            3;
          const ax = positions[afterU]! - positions[beforeU]!;
          const ay = positions[afterU + 1]! - positions[beforeU + 1]!;
          const az = positions[afterU + 2]! - positions[beforeU + 2]!;
          const bx = positions[afterV]! - positions[beforeV]!;
          const by = positions[afterV + 1]! - positions[beforeV + 1]!;
          const bz = positions[afterV + 2]! - positions[beforeV + 2]!;
          const nx = ay * bz - az * by;
          const ny = az * bx - ax * bz;
          const nz = ax * by - ay * bx;
          const length = Math.hypot(nx, ny, nz);
          const at = (offset + i) * BLOOM_VERTEX_STRIDE;
          vertices[at] = positions[i * 3]!;
          vertices[at + 1] = positions[i * 3 + 1]!;
          vertices[at + 2] = positions[i * 3 + 2]!;
          vertices[at + 3] = length > 1e-9 ? nx / length : 0;
          vertices[at + 4] = length > 1e-9 ? ny / length : 0;
          vertices[at + 5] = length > 1e-9 ? nz / length : 1;
        }
    }
    previousP = p;
    previousWidth = width;
    previousHeight = height;
    previousLayout = layout;
    previousLayoutKey = layoutKey;
  }
  return {
    vertices,
    indices: new Uint16Array(indices),
    update,
    inspect: () => ({
      floweringWindows: floweringWindows.map((window) => ({ ...window })),
      axes: axisPaths.map((path, index) => ({
        points: path.points.map((point) => mul(point, worldScale)),
        parent: parents[index]!,
        anchor: parentAnchors[index]!,
        start: axisStarts[index]!,
        end: axisEnds[index]!,
      })),
      clusters: clusters.map((cluster, index) => ({
        axis: cluster.axis,
        t: cluster.t,
        root: mul(axisPoint(cluster.axis, cluster.t), worldScale),
        tip: mul(pathPoint(spurPaths[index]!, 1), worldScale),
        birth: nodeBirth(cluster.axis, cluster.t),
      })),
    }),
  };
}
