import {
  BLOOM_VERTEX_STRIDE,
  createBloomGeometry,
  type BloomLayout,
} from "./scroll-bloom-geometry";

export type SakuraViewport = {
  scrollY: number;
  pageWidth: number;
  pageHeight: number;
  layout?: BloomLayout;
};

export type ScrollBloomRenderer = {
  resize: (width: number, height: number, dpr?: number) => void;
  render: (progress: number, viewport: SakuraViewport) => void;
  dispose: () => void;
};

export type SakuraMaterials = {
  petal: HTMLImageElement;
  leaf: HTMLImageElement;
  bark: HTMLImageElement;
};

let materialsPromise: Promise<SakuraMaterials> | null = null;

// Reuse decoded material inputs across mounts and context restores. A failed
// set is retryable, and no WebGL resources exist while these images load.
export function loadSakuraMaterials(): Promise<SakuraMaterials> {
  if (!materialsPromise) {
    const decode = (name: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => image.decode().then(() => resolve(image), reject);
        image.onerror = () =>
          reject(new Error(`Scroll Bloom: ${name} material could not load.`));
        image.src = `/images/components/sakura-${name}.png`;
      });
    materialsPromise = Promise.all([
      decode("petal"),
      decode("leaf"),
      decode("bark"),
    ])
      .then(([petal, leaf, bark]) => ({ petal, leaf, bark }))
      .catch((error: unknown) => {
        materialsPromise = null;
        throw error;
      });
  }
  return materialsPromise;
}

const VERTEX = String.raw`
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;
attribute vec2 a_material;
uniform mat4 u_projection;
varying vec3 v_normal;
varying vec2 v_uv;
varying vec2 v_material;
void main() {
  v_normal = a_normal;
  v_uv = a_uv;
  v_material = a_material;
  gl_Position = u_projection * vec4(a_position, 1.0);
}
`;

const FRAGMENT = String.raw`
precision highp float;
uniform vec3 u_view;
uniform sampler2D u_petal;
uniform sampler2D u_leaf;
uniform sampler2D u_bark;
varying vec3 v_normal;
varying vec2 v_uv;
varying vec2 v_material;
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
  vec3 view = normalize(u_view);
  vec3 n = normalize(v_normal);
  if (dot(n, view) < 0.0) n = -n;
  vec3 light = normalize(vec3(-0.45, -0.6, 0.75));
  float diffuse = max(dot(n, light), 0.0);
  float wrapped = clamp((dot(n, light) + 0.5) / 1.5, 0.0, 1.0);
  float grain = noise(v_uv * vec2(1381.0, 793.0)) - 0.5;
  vec3 color;
  if (v_material.x < 0.5) {
    // Sample the generated petal material's interior, in image coordinates.
    // The mesh supplies the organic silhouette; transparent image margins never
    // become accidental holes in a growing petal.
    float u = v_uv.x;
    float s = v_uv.y * 2.0 - 1.0;
    float spread = 0.06 + 0.32 * pow(sin(u * 2.67), 0.65);
    vec2 photoUV = vec2(0.5 + s * spread, 0.94 - u * 0.75 + s * s * u * 0.18);
    vec3 photo = texture2D(u_petal, photoUV).rgb;
    float luminance = dot(photo, vec3(0.299, 0.587, 0.114));
    float dx = dot(texture2D(u_petal, photoUV + vec2(0.0015, 0.0)).rgb,
      vec3(0.299, 0.587, 0.114)) - luminance;
    float dy = dot(texture2D(u_petal, photoUV + vec2(0.0, 0.0015)).rgb,
      vec3(0.299, 0.587, 0.114)) - luminance;
    n = normalize(n + vec3(dx, -dy, 0.0) * 1.1);
    float tissueLight = clamp((dot(n, light) + 0.55) / 1.55, 0.0, 1.0);
    // The asset carries fine branching veins and natural, nonuniform pigment.
    // Sakura petals are thin, milky tissue. Broad transmitted light keeps the
    // back faces luminous, while veins and the darker throat retain depth.
    vec3 tissue = mix(photo, vec3(1.0, 0.965, 0.965), 0.40);
    float throat = (1.0 - smoothstep(0.05, 0.42, u));
    tissue *= mix(vec3(1.0), vec3(0.92, 0.65, 0.73), throat * 0.58);
    color = tissue * (0.76 + tissueLight * 0.24) * mix(0.82, 1.0, v_material.y);
    float rim = pow(1.0 - max(dot(n, view), 0.0), 3.0);
    color += vec3(0.045, 0.035, 0.035) * rim;
    float sheen = pow(max(dot(n, normalize(light + view)), 0.0), 24.0);
    color += vec3(0.015, 0.013, 0.013) * sheen;
  } else if (v_material.x < 1.5) {
    vec2 barkUV = vec2(0.08 + v_uv.y * 0.84, 0.05 + v_uv.x * 0.9);
    vec3 bark = texture2D(u_bark, barkUV).rgb;
    bark = mix(bark, vec3(0.50, 0.41, 0.36), 0.18);
    color = bark * (0.68 + diffuse * 0.32);
    float sheen = pow(max(dot(n, normalize(light + view)), 0.0), 34.0);
    color += vec3(0.026, 0.02, 0.013) * sheen;
  } else if (v_material.x < 2.5) {
    // Leaf tissue follows the folded mesh; the image supplies its irregular
    // branching venation and local colour rather than a painted flat green.
    float along = v_uv.x;
    float across = v_uv.y * 2.0 - 1.0;
    float leafWidth = 0.2 * pow(sin(along * 3.14159), 0.72);
    vec2 leafUV = vec2(0.5 + across * leafWidth, 0.9 - along * 0.8);
    vec3 leaf = texture2D(u_leaf, leafUV).rgb;
    float transmitted = pow(1.0 - max(dot(n, view), 0.0), 2.0);
    color = leaf * (0.48 + wrapped * 0.52);
    color += vec3(0.035, 0.05, 0.012) * transmitted;
    float sheen = pow(max(dot(n, normalize(light + view)), 0.0), 19.0);
    color += vec3(0.045, 0.05, 0.026) * sheen;
  } else if (v_material.x < 3.5) {
    color = mix(vec3(0.93, 0.67, 0.7), vec3(1.0, 0.94, 0.84), v_uv.x);
    color *= 0.7 + diffuse * 0.3;
  } else if (v_material.x < 4.5) {
    color = vec3(0.75, 0.5, 0.15) * (0.7 + diffuse * 0.3) + grain * 0.04;
  } else if (v_material.x < 5.5) {
    vec3 calyx = mix(vec3(0.43, 0.17, 0.2), vec3(0.46, 0.32, 0.24), smoothstep(0.0, 0.75, v_uv.x));
    color = calyx * (0.57 + wrapped * 0.43);
  } else {
    vec2 budUV = vec2(0.3 + v_uv.y * 0.4, 0.58 + v_uv.x * 0.27);
    vec3 bud = texture2D(u_petal, budUV).rgb;
    bud = mix(bud, vec3(0.92, 0.55, 0.66), 0.35);
    float base = smoothstep(0.73, 1.0, v_uv.x);
    color = mix(bud, vec3(0.43, 0.19, 0.23), base * 0.85);
    color *= 0.8 + wrapped * 0.2;
  }
  gl_FragColor = vec4(color, 1.0);
}
`;

const VIEW = [0, 0, 1] as const;
const PIXEL_BUDGET = 1_250_000;

function projection(
  width: number,
  height: number,
  scrollY: number,
): Float32Array {
  // Geometry belongs to the document. Only the visible slice is projected;
  // scrolling never stretches the branch or allocates a page-height canvas.
  return new Float32Array([
    2 / width,
    0,
    0,
    0,
    0,
    -2 / height,
    0,
    0,
    0,
    0,
    -1 / 1000,
    0,
    -1,
    1 + (2 * scrollY) / height,
    0,
    1,
  ]);
}

export function createScrollBloomRenderer(
  canvas: HTMLCanvasElement,
  materials: SakuraMaterials,
): ScrollBloomRenderer {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: true,
    stencil: false,
    // Enables a faithful static fallback to be captured from the real renderer.
    // There is no continuous drawing, so retaining this small buffer is cheap.
    preserveDrawingBuffer: true,
    powerPreference: "low-power",
  });
  if (!gl) throw new Error("Scroll Bloom: WebGL is unavailable.");

  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  let vertexBuffer: WebGLBuffer | null = null;
  let indexBuffer: WebGLBuffer | null = null;
  const textures: WebGLTexture[] = [];
  let disposed = false;

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (vertexBuffer) gl!.deleteBuffer(vertexBuffer);
    if (indexBuffer) gl!.deleteBuffer(indexBuffer);
    for (const texture of textures) gl!.deleteTexture(texture);
    if (program) gl!.deleteProgram(program);
    for (const shader of shaders) gl!.deleteShader(shader);
  }

  try {
    function compile(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) throw new Error("Scroll Bloom: shader allocation failed.");
      shaders.push(shader);
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        throw new Error(
          `Scroll Bloom: ${gl!.getShaderInfoLog(shader) || "shader compilation failed"}`,
        );
      }
      return shader;
    }

    const vertexShader = compile(gl.VERTEX_SHADER, VERTEX);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    program = gl.createProgram();
    if (!program) throw new Error("Scroll Bloom: program allocation failed.");
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        `Scroll Bloom: ${gl.getProgramInfoLog(program) || "program link failed"}`,
      );
    }

    for (const [unit, material] of [
      materials.petal,
      materials.leaf,
      materials.bark,
    ].entries()) {
      const texture = gl.createTexture();
      if (!texture) throw new Error("Scroll Bloom: texture allocation failed.");
      textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        material,
      );
    }

    vertexBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();
    if (!vertexBuffer || !indexBuffer)
      throw new Error("Scroll Bloom: geometry allocation failed.");
    const geometry = createBloomGeometry();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      geometry.vertices.byteLength,
      gl.DYNAMIC_DRAW,
    );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
    if (gl.getError() !== gl.NO_ERROR)
      throw new Error("Scroll Bloom: geometry upload failed.");

    const position = gl.getAttribLocation(program, "a_position");
    const normal = gl.getAttribLocation(program, "a_normal");
    const uv = gl.getAttribLocation(program, "a_uv");
    const material = gl.getAttribLocation(program, "a_material");
    const camera = gl.getUniformLocation(program, "u_projection");
    const view = gl.getUniformLocation(program, "u_view");
    const samplers = ["u_petal", "u_leaf", "u_bark"].map((name) =>
      gl.getUniformLocation(program!, name),
    );
    if (
      position < 0 ||
      normal < 0 ||
      uv < 0 ||
      material < 0 ||
      !camera ||
      !view ||
      samplers.some((sampler) => sampler === null)
    )
      throw new Error("Scroll Bloom: shader bindings are unavailable.");
    let viewportWidth = 1440;
    let viewportHeight = 900;
    let lastProgress = -1;
    let lastPageWidth = -1;
    let lastPageHeight = -1;
    let lastLayout: BloomLayout | undefined;

    function resize(width: number, height: number, dpr = 1) {
      if (disposed) return;
      const cssWidth = Number.isFinite(width) ? Math.max(1, width) : 1;
      const cssHeight = Number.isFinite(height) ? Math.max(1, height) : 1;
      const ratio = Number.isFinite(dpr) ? Math.max(0.1, Math.min(2, dpr)) : 1;
      const scale = Math.min(
        ratio,
        Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight)),
      );
      const pixelWidth = Math.max(1, Math.floor(cssWidth * scale));
      const pixelHeight = Math.max(1, Math.floor(cssHeight * scale));
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      viewportWidth = cssWidth;
      viewportHeight = cssHeight;
    }

    function render(progress: number, viewport: SakuraViewport) {
      if (disposed) return;
      if (gl!.isContextLost())
        throw new Error("Scroll Bloom: WebGL context was lost.");
      const value = Number.isFinite(progress)
        ? Math.max(0, Math.min(1, progress))
        : 0;
      gl!.viewport(0, 0, canvas.width, canvas.height);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clearDepth(1);
      gl!.enable(gl!.DEPTH_TEST);
      gl!.depthFunc(gl!.LEQUAL);
      gl!.depthMask(true);
      gl!.disable(gl!.BLEND);
      gl!.disable(gl!.CULL_FACE);
      gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
      gl!.useProgram(program);
      textures.forEach((texture, unit) => {
        gl!.activeTexture(gl!.TEXTURE0 + unit);
        gl!.bindTexture(gl!.TEXTURE_2D, texture);
        gl!.uniform1i(samplers[unit]!, unit);
      });
      gl!.bindBuffer(gl!.ARRAY_BUFFER, vertexBuffer);
      gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, indexBuffer);
      const pageWidth = Math.max(
        viewportWidth,
        viewport.pageWidth || viewportWidth,
      );
      const pageHeight = Math.max(
        viewportHeight,
        viewport.pageHeight || viewportHeight,
      );
      if (
        value !== lastProgress ||
        pageWidth !== lastPageWidth ||
        pageHeight !== lastPageHeight ||
        viewport.layout !== lastLayout
      ) {
        geometry.update(value, pageWidth, pageHeight, viewport.layout);
        gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, geometry.vertices);
        lastProgress = value;
        lastPageWidth = pageWidth;
        lastPageHeight = pageHeight;
        lastLayout = viewport.layout;
      }
      const stride = BLOOM_VERTEX_STRIDE * Float32Array.BYTES_PER_ELEMENT;
      gl!.enableVertexAttribArray(position);
      gl!.enableVertexAttribArray(normal);
      gl!.enableVertexAttribArray(material);
      gl!.enableVertexAttribArray(uv);
      gl!.vertexAttribPointer(position, 3, gl!.FLOAT, false, stride, 0);
      gl!.vertexAttribPointer(normal, 3, gl!.FLOAT, false, stride, 12);
      gl!.vertexAttribPointer(uv, 2, gl!.FLOAT, false, stride, 24);
      gl!.vertexAttribPointer(material, 2, gl!.FLOAT, false, stride, 32);
      gl!.uniformMatrix4fv(
        camera,
        false,
        projection(viewportWidth, viewportHeight, viewport.scrollY || 0),
      );
      gl!.uniform3f(view, VIEW[0], VIEW[1], VIEW[2]);
      gl!.drawElements(
        gl!.TRIANGLES,
        geometry.indices.length,
        gl!.UNSIGNED_SHORT,
        0,
      );
    }

    return { resize, render, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
