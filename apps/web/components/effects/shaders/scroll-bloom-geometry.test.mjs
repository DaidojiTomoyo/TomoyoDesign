import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  BLOOM_VERTEX_STRIDE,
  createBloomGeometry,
} from "./scroll-bloom-geometry.ts";

const fingerprint = (vertices) =>
  createHash("sha256").update(Buffer.from(vertices.buffer)).digest("hex");

// Real heading, copy, workflow and CTA footprints captured at the four desktop
// sizes. These are source fixtures; tests do not depend on review artifacts.
const measuredLayouts = [
  {
    width: 1200,
    height: 3975,
    rects: [
      [56, 29.594, 168.75, 28.797],
      [456.672, 23.5, 286.641, 41],
      [852.938, 22.5, 291.062, 43],
      [56, 144.188, 788.547, 180.203],
      [56, 343.594, 520, 192.281],
      [1100, 648, 44, 44],
      [56, 660, 109.203, 17],
      [56, 824.203, 251.406, 52.797],
      [977.078, 849, 166.922, 28],
      [56, 1489.812, 221.109, 43.188],
      [905.641, 1484, 238.359, 24],
      [56, 2020.797, 214.266, 22.391],
      [1007.797, 2018, 136.203, 28],
      [56, 2229, 230.188, 48],
      [744, 2219, 400, 58],
      [56, 2955, 259.625, 16],
      [56, 3141, 201.906, 48],
      [960.141, 3161, 183.859, 28],
      [56, 3229, 336, 85],
      [432, 3229, 336, 85],
      [808, 3229, 336, 85],
      [56, 3458, 557.25, 88],
      [919.469, 3476, 224.531, 52],
      [56, 3631.312, 238.844, 22.391],
      [757.625, 3632.109, 386.375, 20.797],
      [56, 3685, 1083.797, 157],
      [56, 3930.5, 100.109, 15],
      [1053.859, 3929, 90.141, 18],
    ],
  },
  {
    width: 1280,
    height: 3975,
    rects: [
      [56, 29.594, 168.75, 28.797],
      [496.672, 23.5, 286.641, 41],
      [932.938, 22.5, 291.062, 43],
      [56, 144.188, 788.547, 180.203],
      [56, 343.594, 520, 192.281],
      [1180, 648, 44, 44],
      [56, 660, 109.203, 17],
      [56, 824.203, 251.406, 52.797],
      [1057.078, 849, 166.922, 28],
      [56, 1489.812, 221.109, 43.188],
      [985.641, 1484, 238.359, 24],
      [56, 2020.797, 214.266, 22.391],
      [1087.797, 2018, 136.203, 28],
      [56, 2229, 230.188, 48],
      [824, 2219, 400, 58],
      [56, 2955, 259.625, 16],
      [56, 3141, 201.906, 48],
      [1040.141, 3161, 183.859, 28],
      [56, 3229, 362.656, 85],
      [458.656, 3229, 362.672, 85],
      [861.328, 3229, 362.656, 85],
      [56, 3458, 557.25, 88],
      [999.469, 3476, 224.531, 52],
      [56, 3631.312, 238.844, 22.391],
      [837.625, 3632.109, 386.375, 20.797],
      [56, 3685, 1156.094, 168],
      [56, 3930.5, 100.109, 15],
      [1133.859, 3929, 90.141, 18],
    ],
  },
  {
    width: 1440,
    height: 4155,
    rects: [
      [56, 29.594, 168.75, 28.797],
      [576.672, 23.5, 286.641, 41],
      [1092.938, 22.5, 291.062, 43],
      [56, 157.5, 985.688, 225.5],
      [56, 401.5, 520, 192.281],
      [1340, 828, 44, 44],
      [56, 840, 109.203, 17],
      [56, 1004.203, 251.406, 52.797],
      [1217.078, 1029, 166.922, 28],
      [56, 1669.812, 221.109, 43.188],
      [1145.641, 1664, 238.359, 24],
      [56, 2200.797, 214.266, 22.391],
      [1247.797, 2198, 136.203, 28],
      [56, 2409, 230.188, 48],
      [984, 2399, 400, 58],
      [56, 3135, 259.625, 16],
      [56, 3321, 201.906, 48],
      [1200.141, 3341, 183.859, 28],
      [56, 3409, 416, 85],
      [512, 3409, 416, 85],
      [968, 3409, 416, 85],
      [56, 3638, 557.25, 88],
      [1159.469, 3656, 224.531, 52],
      [56, 3811.312, 238.844, 22.391],
      [997.625, 3812.109, 386.375, 20.797],
      [56, 3865, 1300.578, 190],
      [56, 4110.5, 100.109, 15],
      [1293.859, 4109, 90.141, 18],
    ],
  },
  {
    width: 1920,
    height: 4173,
    rects: [
      [296, 29.594, 168.75, 28.797],
      [816.672, 23.5, 286.641, 41],
      [1332.938, 22.5, 291.062, 43],
      [296, 159, 1005.438, 230.625],
      [296, 407.25, 520, 192.281],
      [1580, 846, 44, 44],
      [296, 858, 109.203, 17],
      [296, 1022.203, 251.406, 52.797],
      [1457.078, 1047, 166.922, 28],
      [296, 1687.812, 221.109, 43.188],
      [1385.641, 1682, 238.359, 24],
      [296, 2218.797, 214.266, 22.391],
      [1487.797, 2216, 136.203, 28],
      [296, 2427, 230.188, 48],
      [1224, 2417, 400, 58],
      [296, 3153, 259.625, 16],
      [296, 3339, 201.906, 48],
      [1440.141, 3359, 183.859, 28],
      [296, 3427, 416, 85],
      [752, 3427, 416, 85],
      [1208, 3427, 416, 85],
      [296, 3656, 557.25, 88],
      [1399.469, 3674, 224.531, 52],
      [296, 3829.312, 238.844, 22.391],
      [1237.625, 3830.109, 386.375, 20.797],
      [296, 3883, 1300.656, 190],
      [296, 4128.5, 100.109, 15],
      [1533.859, 4127, 90.141, 18],
    ],
  },
];

function layoutFor(fixture) {
  const offset = fixture.rects[7][1] - 824.203;
  const left = fixture.rects[7][0];
  return {
    viewportHeight:
      fixture.width >= 1920 ? 1080 : fixture.width >= 1440 ? 900 : 720,
    clearances: fixture.rects.map(([x, y, width, height]) => ({
      x,
      y,
      width,
      height,
    })),
    surfaces: [
      {
        x: left,
        y: 905 + offset,
        width: fixture.width - left * 2,
        height: 474,
      },
      {
        x: left,
        y: 1557 + offset,
        width: fixture.width - left * 2,
        height: 430,
      },
      {
        x: left,
        y: 2309 + offset,
        width: fixture.width - left * 2,
        height: 614,
      },
    ],
  };
}

function edgeCrossesRect(a, b, rect) {
  let near = 0;
  let far = 1;
  for (const [k, low, high] of [
    [0, rect.x + 0.01, rect.x + rect.width - 0.01],
    [1, rect.y + 0.01, rect.y + rect.height - 0.01],
  ]) {
    const delta = b[k] - a[k];
    if (Math.abs(delta) < 1e-8) {
      if (a[k] <= low || a[k] >= high) return false;
    } else {
      const one = (low - a[k]) / delta;
      const two = (high - a[k]) / delta;
      near = Math.max(near, Math.min(one, two));
      far = Math.min(far, Math.max(one, two));
      if (near >= far) return false;
    }
  }
  return near < far && far > 0 && near < 1;
}

test("whole flowers and connected wood clear measured text and opaque demos at four desktop sizes", () => {
  const geometry = createBloomGeometry();
  for (const fixture of measuredLayouts) {
    const layout = layoutFor(fixture);
    for (const progress of [0, 0.15, 0.45, 0.75, 1]) {
      geometry.update(progress, fixture.width, fixture.height, layout);
      const { vertices, indices } = geometry;
      for (let i = 0; i < indices.length; i += 3) {
        const points = [0, 1, 2].map((n) =>
          vertices.subarray(
            indices[i + n] * BLOOM_VERTEX_STRIDE,
            indices[i + n] * BLOOM_VERTEX_STRIDE + 3,
          ),
        );
        const minX = Math.min(...points.map((point) => point[0]));
        const maxX = Math.max(...points.map((point) => point[0]));
        const minY = Math.min(...points.map((point) => point[1]));
        const maxY = Math.max(...points.map((point) => point[1]));
        if (maxX - minX < 1e-5 && maxY - minY < 1e-5) continue;
        for (const rect of [...layout.clearances, ...layout.surfaces]) {
          if (
            maxX <= rect.x ||
            minX >= rect.x + rect.width ||
            maxY <= rect.y ||
            minY >= rect.y + rect.height
          )
            continue;
          for (let edge = 0; edge < 3; edge++)
            assert.equal(
              edgeCrossesRect(points[edge], points[(edge + 1) % 3], rect),
              false,
              `Text collision at width ${fixture.width}, growth ${progress}, material ${vertices[indices[i] * BLOOM_VERTEX_STRIDE + 8]}, rect ${JSON.stringify(rect)}, points ${JSON.stringify(points.map((p) => Array.from(p)))}`,
            );
        }
      }
    }
    assert.equal(
      blossoms(geometry).length,
      56,
      "Routing retains every open/half-open flower",
    );
  }
});

test("layout routing is fixed during scroll, reversible and refreshed by content", () => {
  const geometry = createBloomGeometry();
  const fixture = measuredLayouts[1];
  const layout = {
    clearances: fixture.rects.map(([x, y, width, height]) => ({
      x,
      y,
      width,
      height,
    })),
  };
  geometry.update(0.45, fixture.width, fixture.height, layout);
  const expected = fingerprint(geometry.vertices);
  geometry.update(1, fixture.width, fixture.height, layout);
  geometry.update(0.45, fixture.width, fixture.height, layout);
  assert.equal(fingerprint(geometry.vertices), expected);
  geometry.update(0.45, fixture.width, fixture.height, structuredClone(layout));
  assert.equal(
    fingerprint(geometry.vertices),
    expected,
    "Equivalent layout objects reuse the same geometry",
  );
  geometry.update(0.45, fixture.width, fixture.height);
  assert.notEqual(fingerprint(geometry.vertices), expected);
  geometry.update(0.45, fixture.width, fixture.height, layout);
  assert.equal(
    fingerprint(geometry.vertices),
    expected,
    "Restoring a measured layout has no path history",
  );
});

test("flowering boughs attach to stable parent nodes without rectangular detours", () => {
  const geometry = createBloomGeometry();
  for (const fixture of measuredLayouts) {
    const layout = layoutFor(fixture);
    geometry.update(1, fixture.width, fixture.height, layout);
    const { axes, clusters } = geometry.inspect();
    assert.equal(axes.length, 8);
    for (const branch of axes.slice(1)) {
      const root = branch.points[0];
      const parent = axes[branch.parent];
      const closest = Math.min(
        ...parent.points.slice(1).map((b, i) => {
          const a = parent.points[i];
          const delta = b.map((value, k) => value - a[k]);
          const u = Math.max(
            0,
            Math.min(
              1,
              root.reduce(
                (sum, value, k) => sum + (value - a[k]) * delta[k],
                0,
              ) / delta.reduce((sum, value) => sum + value * value, 0),
            ),
          );
          return Math.hypot(
            ...root.map((value, k) => value - a[k] - u * delta[k]),
          );
        }),
      );
      assert.ok(
        closest < 0.001,
        "Every secondary bough starts on its actual parent curve",
      );
      let worstTurn = 0;
      for (let i = 1; i < branch.points.length - 1; i++) {
        const a = branch.points[i].map((n, k) => n - branch.points[i - 1][k]);
        const b = branch.points[i + 1].map((n, k) => n - branch.points[i][k]);
        const cosine =
          a.reduce((sum, n, k) => sum + n * b[k], 0) /
          (Math.hypot(...a) * Math.hypot(...b));
        worstTurn = Math.max(
          worstTurn,
          Math.acos(Math.max(-1, Math.min(1, cosine))),
        );
      }
      assert.ok(
        worstTurn < 0.3,
        "Authored cubic wood has no corner-route kinks",
      );
      const chord = Math.hypot(
        ...branch.points.at(-1).map((n, k) => n - root[k]),
      );
      const length = branch.points
        .slice(1)
        .reduce(
          (sum, point, i) =>
            sum + Math.hypot(...point.map((n, k) => n - branch.points[i][k])),
          0,
        );
      assert.ok(
        length / chord < 1.65,
        "Secondary wood stays a direct organic gesture, without loops or detour brackets",
      );
    }
    assert.ok(
      clusters.every(
        (cluster) =>
          Math.hypot(
            ...cluster.tip.map((value, k) => value - cluster.root[k]),
          ) < 95,
      ),
      "Flowers attach on short shoots, not displaced cables",
    );
    const workflow = layout.clearances[18];
    assert.ok(
      axes
        .slice(1)
        .every((branch) =>
          branch.points.every(
            (point) =>
              point[1] < workflow.y || point[1] > workflow.y + workflow.height,
          ),
        ),
      "No secondary branch threads the workflow columns",
    );
  }
});

test("the first side branch departs once without rejoining the parent", () => {
  const geometry = createBloomGeometry();
  const orientation = (a, b, c) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (const fixture of measuredLayouts) {
    geometry.update(1, fixture.width, fixture.height, layoutFor(fixture));
    const [parent, branch] = geometry.inspect().axes;
    for (let i = 1; i < branch.points.length; i++) {
      const a = branch.points[i - 1],
        b = branch.points[i];
      for (let j = 1; j < parent.points.length; j++) {
        const c = parent.points[j - 1],
          d = parent.points[j];
        const crosses =
          orientation(a, b, c) * orientation(a, b, d) < -1e-8 &&
          orientation(c, d, a) * orientation(c, d, b) < -1e-8;
        assert.equal(
          crosses,
          false,
          `Side branch crosses parent at ${fixture.width}px`,
        );
      }
    }
  }
});

test("the main bough never becomes an uninterrupted page-edge wire", () => {
  const geometry = createBloomGeometry();
  for (const fixture of measuredLayouts) {
    geometry.update(1, fixture.width, fixture.height, layoutFor(fixture));
    const points = geometry.inspect().axes[0].points;
    let start = null,
      longest = 0;
    for (const point of points) {
      if (point[0] >= 0) {
        start ??= point[1];
        longest = Math.max(longest, point[1] - start);
      } else start = null;
    }
    assert.ok(
      longest < 400,
      `Visible woody gestures stay bounded at ${fixture.width}px: ${longest}px`,
    );
    assert.ok(
      points.filter((point) => point[0] < 0).length > points.length * 0.4,
      "Parent continuity can extend beyond the physical page edge between real nodes",
    );
  }
});

test("flower opening happens within the middle of the actual viewport", () => {
  const geometry = createBloomGeometry();
  for (const fixture of measuredLayouts) {
    const layout = layoutFor(fixture);
    geometry.update(1, fixture.width, fixture.height, layout);
    const scrollRange = fixture.height - layout.viewportHeight;
    const flowers = geometry
      .inspect()
      .floweringWindows.filter((window) => !window.closed && window.start >= 0);
    assert.ok(flowers.length >= 45);
    for (const window of flowers) {
      const openingTop = window.y - window.start * scrollRange;
      const openedTop = window.y - window.end * scrollRange;
      assert.ok(
        openingTop <= layout.viewportHeight * 0.7,
        "Opening starts after a cluster enters the readable part of the viewport",
      );
      assert.ok(
        openedTop >= layout.viewportHeight * 0.38,
        "Opening finishes before a cluster scrolls toward the top edge",
      );
      assert.ok(
        window.end <= 1,
        "Every intended bloom can finish before the document ends",
      );
    }
  }
});

test("viewport measurements invalidate growth scheduling without moving mature branches", () => {
  const fixture = measuredLayouts[1];
  const layout = layoutFor(fixture);
  const geometry = createBloomGeometry();
  geometry.update(1, fixture.width, fixture.height, layout);
  const mature = fingerprint(geometry.vertices);
  const small = geometry
    .inspect()
    .floweringWindows.map((window) => window.start);
  const taller = { ...layout, viewportHeight: 1000 };
  geometry.update(1, fixture.width, fixture.height, taller);
  assert.equal(fingerprint(geometry.vertices), mature);
  assert.notDeepEqual(
    geometry.inspect().floweringWindows.map((window) => window.start),
    small,
  );
  geometry.update(0.4, fixture.width, fixture.height, taller);
  const expected = fingerprint(geometry.vertices);
  geometry.update(0.4, fixture.width, fixture.height, layout);
  assert.notEqual(fingerprint(geometry.vertices), expected);
});

// Future surfaces reserve storage but have no triangle area. Bounds based on
// all vertices would incorrectly treat their collapsed anchors as visible wood.
function visibleMesh(geometry, materials) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let triangles = 0;
  let area = 0;
  const { vertices, indices } = geometry;
  for (let i = 0; i < indices.length; i += 3) {
    const points = [0, 1, 2].map((n) => indices[i + n] * BLOOM_VERTEX_STRIDE);
    if (materials && !materials.includes(vertices[points[0] + 8])) continue;
    const a = [0, 1, 2].map(
      (k) => vertices[points[1] + k] - vertices[points[0] + k],
    );
    const b = [0, 1, 2].map(
      (k) => vertices[points[2] + k] - vertices[points[0] + k],
    );
    const triangleArea =
      Math.hypot(
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ) / 2;
    if (triangleArea < 1e-6) continue;
    triangles++;
    area += triangleArea;
    for (const point of points)
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], vertices[point + k]);
        max[k] = Math.max(max[k], vertices[point + k]);
      }
  }
  return { min, max, triangles, area };
}

// Petal UV origins meet at the flower's receptacle. Group them by that spatial
// point to measure actual blossom count and size independently of tessellation.
function blossoms(geometry) {
  const groups = new Map();
  let current;
  for (let i = 0; i < geometry.vertices.length; i += BLOOM_VERTEX_STRIDE) {
    const v = geometry.vertices;
    if (v[i + 8] !== 0) continue;
    if (v[i + 6] === 0 && v[i + 7] === 0) {
      const center = Array.from(v.subarray(i, i + 3));
      const key = center.map((n) => n.toFixed(3)).join(",");
      if (!groups.has(key)) groups.set(key, { center, radius: 0, petals: 0 });
      current = groups.get(key);
      current.petals++;
    }
    current.radius = Math.max(
      current.radius,
      Math.hypot(...current.center.map((n, k) => v[i + k] - n)),
    );
  }
  return [...groups.values()].filter((flower) => flower.radius > 1);
}

test("forward, reverse and direct entry restore identical document geometry", () => {
  const geometry = createBloomGeometry();
  const positions = [0, 0.015, 0.1, 0.27, 0.48, 0.71, 0.9, 1];
  const forward = positions.map((progress) => {
    geometry.update(progress);
    return fingerprint(geometry.vertices);
  });
  assert.ok(
    new Set(forward).size >= positions.length - 1,
    "Only the fully settled last stages may be identical",
  );
  for (let i = positions.length - 1; i >= 0; i--) {
    geometry.update(positions[i]);
    assert.equal(
      fingerprint(geometry.vertices),
      forward[i],
      `Reverse scroll at ${positions[i]}`,
    );
    const direct = createBloomGeometry();
    direct.update(positions[i]);
    assert.equal(
      fingerprint(direct.vertices),
      forward[i],
      `Refresh at ${positions[i]}`,
    );
  }
});

test("all growth stages keep valid normals and a stable WebGL 1 mesh budget", () => {
  const geometry = createBloomGeometry();
  const vertexCount = geometry.vertices.length / BLOOM_VERTEX_STRIDE;
  const { vertices, indices } = geometry;
  assert.ok(
    vertexCount <= 65300,
    "Extra parent curve rings retain headroom within Uint16 indexing",
  );
  assert.ok(indices instanceof Uint16Array);
  assert.equal(indices.length % 3, 0);
  assert.ok(indices.every((index) => index < vertexCount));
  for (let step = 0; step <= 100; step++) {
    geometry.update(step / 100);
    assert.equal(geometry.vertices, vertices);
    assert.equal(geometry.indices, indices);
    assert.ok(vertices.every(Number.isFinite), `Invalid geometry at ${step}%`);
    for (let i = 0; i < vertices.length; i += BLOOM_VERTEX_STRIDE) {
      assert.ok(
        Math.abs(
          Math.hypot(vertices[i + 3], vertices[i + 4], vertices[i + 5]) - 1,
        ) < 1e-5,
      );
      assert.ok(vertices[i + 8] >= 0 && vertices[i + 8] <= 6);
    }
  }
});

test("the first screen has an upper-left sprig, buds and only a small first bloom", () => {
  const geometry = createBloomGeometry();
  geometry.update(0);
  const initial = visibleMesh(geometry);
  assert.ok(
    initial.min[0] < 0 && initial.min[1] < 0,
    "The woody source enters from outside the page",
  );
  assert.ok(
    initial.max[1] > 500 && initial.max[1] < 630,
    "No disconnected future branches",
  );
  assert.ok(initial.max[0] < 260);
  assert.ok(visibleMesh(geometry, [6]).area > 200);
  assert.ok(blossoms(geometry).length <= 3);
  const firstPetals = visibleMesh(geometry, [0]).area;
  geometry.update(1);
  assert.ok(firstPetals < visibleMesh(geometry, [0]).area * 0.08);
});

test("wood advances down the document while established branch rings stay fixed", () => {
  const geometry = createBloomGeometry();
  geometry.update(0);
  const oldWood = geometry.vertices.slice(0, BLOOM_VERTEX_STRIDE * 90);
  let previousBottom = visibleMesh(geometry).max[1];
  for (const progress of [0.1, 0.25, 0.5, 0.75, 1]) {
    geometry.update(progress);
    const bottom = visibleMesh(geometry).max[1];
    assert.ok(bottom > previousBottom);
    assert.deepEqual(
      geometry.vertices.slice(0, oldWood.length),
      oldWood,
      "Established wood must not stretch with the growing tip",
    );
    previousBottom = bottom;
  }
  assert.ok(previousBottom > 3500 && previousBottom < 3750);
});

test("mature small blossoms populate the whole bough and retain unopened buds", () => {
  const geometry = createBloomGeometry();
  geometry.update(1);
  const flowers = blossoms(geometry);
  assert.equal(flowers.length, 56, "64 flower sites retain eight closed buds");
  assert.ok(flowers.every((flower) => flower.petals === 5));
  const open = flowers.filter((flower) => flower.radius > 16);
  assert.ok(
    open.length >= 46,
    "A clear majority of the denser clusters fully flower",
  );
  assert.ok(
    open.every((flower) => flower.radius < 32),
    "No giant flowers",
  );
  // Long continuous bark patches include the older axes and subordinate forks. Measure
  // proximity in space so extra flowers cannot all hang on distant long stems.
  const majorWood = [];
  let bark = [];
  for (let i = 0; i < geometry.vertices.length; i += BLOOM_VERTEX_STRIDE) {
    if (geometry.vertices[i + 8] === 1) bark.push(i);
    else if (bark.length) {
      if (bark.length > 300) majorWood.push(...bark);
      bark = [];
    }
  }
  const closeToWood = flowers.filter((flower) =>
    majorWood.some(
      (at) =>
        Math.hypot(
          ...flower.center.map(
            (coordinate, k) => coordinate - geometry.vertices[at + k],
          ),
        ) < 120,
    ),
  );
  assert.ok(
    closeToWood.length >= 40,
    "Dense flowering must also occupy short node shoots along the wood",
  );
  const bands = new Set(
    flowers.map((flower) => Math.min(3, Math.floor(flower.center[1] / 1050))),
  );
  assert.equal(bands.size, 4, "Flowering continues into the lower page");
  const mesh = visibleMesh(geometry);
  assert.ok(mesh.min[0] > -230 && mesh.max[0] > 280 && mesh.max[0] < 600);
  assert.ok(
    visibleMesh(geometry, [6]).area > 1500,
    "Closed buds survive the mature state",
  );
  assert.ok(
    visibleMesh(geometry, [2]).area < visibleMesh(geometry, [0]).area * 0.06,
    "Leaves remain sparse",
  );
  assert.ok(
    mesh.max[2] - mesh.min[2] > 50,
    "Flowers have distinct depth and face directions",
  );
});

test("document height redistributes branches without stretching individual flowers", () => {
  const geometry = createBloomGeometry();
  geometry.update(1, 1440, 4200);
  const original = blossoms(geometry);
  const rootCenter = () =>
    [0, 1, 2].map(
      (k) =>
        Array.from(
          { length: 8 },
          (_, i) => geometry.vertices[i * BLOOM_VERTEX_STRIDE + k],
        ).reduce((sum, n) => sum + n, 0) / 8,
    );
  const root = rootCenter();
  geometry.update(1, 1440, 5460);
  const taller = blossoms(geometry);
  assert.equal(taller.length, original.length);
  for (let i = 0; i < taller.length; i++) {
    assert.ok(Math.abs(taller[i].radius - original[i].radius) < 0.001);
  }
  assert.ok(visibleMesh(geometry).max[1] > 4600);
  const tallRoot = rootCenter();
  assert.ok(Math.abs(tallRoot[0] - root[0]) < 0.001);
  assert.ok(
    Math.abs(tallRoot[1] - root[1] * 1.3) < 0.001,
    "Branch y follows page height",
  );
  geometry.update(1, 1440, 4200);
  assert.deepEqual(blossoms(geometry), original);
});

test("responsive routing preserves flower scale and rejects invalid dimensions", () => {
  const geometry = createBloomGeometry();
  geometry.update(1, 1440, 4200);
  const full = blossoms(geometry);
  geometry.update(1, 1200, 3500);
  const small = blossoms(geometry);
  assert.equal(small.length, full.length);
  for (let i = 0; i < full.length; i++)
    assert.ok(
      Math.abs(small[i].radius - (full[i].radius * 1200) / 1440) < 0.001,
      "Responsive woody routes may change position, but the flowers keep their physical proportions",
    );
  geometry.update(NaN, -5, Infinity);
  const invalid = fingerprint(geometry.vertices);
  geometry.update(0, 1440, 4200);
  assert.equal(fingerprint(geometry.vertices), invalid);
  geometry.update(2);
  const clamped = fingerprint(geometry.vertices);
  geometry.update(1);
  assert.equal(fingerprint(geometry.vertices), clamped);
});
