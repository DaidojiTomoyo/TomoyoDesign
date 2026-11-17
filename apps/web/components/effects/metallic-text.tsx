"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { metallicTextFragmentShader } from "./shaders/metallic-text";
import { createTextSurface } from "./shaders/text-distance-field";
import styles from "./metallic-text.module.css";

gsap.registerPlugin(useGSAP);

type LightPosition = { x: number; y: number };
type RendererControls = {
  setActive: (active: boolean) => void;
  setPaused: (paused: boolean) => void;
  move: (x: number, y: number) => void;
  nudge: (x: number, y: number) => void;
  reset: () => void;
};

const DEFAULT_LIGHT = { x: 0.5, y: 0.5 };
const MASK_WIDTH = 1328;
const MASK_HEIGHT = 430;
const MASK_SCALE = 2;
const SURFACE_SCALE = 0.5;
let cachedSurface: { family: string; pixels: Uint8Array } | undefined;
const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader allocation failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error("Metallic text shader could not compile");
  }
  return shader;
}

export function MetallicText({
  variant = "homepage",
  active = true,
  onStatusChange,
}: {
  variant?: "homepage" | "catalog";
  active?: boolean;
  onStatusChange?: (status: "loading" | "ready" | "fallback") => void;
} = {}) {
  const compact = variant === "catalog";
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RendererControls | null>(null);
  const activeRef = useRef(active);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [motionReduced, setMotionReduced] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );
  const [contextVersion, setContextVersion] = useState(0);
  const descriptionId = useId();

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useGSAP(() => {
    activeRef.current = active;
    rendererRef.current?.setActive(active);
  }, [active]);

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      if (!canvas || !stage) return;

      let destroyed = false;
      let ticking = false;
      let visible = false;
      let initializationStarted = false;
      let startRenderer = () => {};
      let firstTick = true;
      let elapsed = 0;
      let pendingDelta = 0;
      let nextPaint = 0;
      const paintInterval = 1 / (compact ? 30 : 60);
      let cleanupRenderer: (() => void) | undefined;
      let releaseContext: (() => void) | undefined;
      const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
      let reducedMotion = preference.matches;
      setMotionReduced(reducedMotion);
      const target: LightPosition = { ...DEFAULT_LIGHT };
      const current: LightPosition = { ...DEFAULT_LIGHT };
      let render: (deltaSeconds?: number) => boolean = () => false;

      const stopTicker = () => {
        gsap.ticker.remove(tick);
        ticking = false;
      };
      const tick = (now: number, deltaTime: number) => {
        if (destroyed || !activeRef.current || !visible || document.hidden) {
          stopTicker();
          return;
        }
        const delta = firstTick ? 0 : Math.min(0.05, deltaTime / 1000);
        pendingDelta += delta;
        const shouldPaint = firstTick || now + 0.001 >= nextPaint;
        firstTick = false;
        if (!shouldPaint) return;
        const frameDelta = pendingDelta;
        pendingDelta = 0;
        // Advance the previous deadline, retaining its fractional remainder.
        // Skipped high-refresh ticks still contribute to the material's clock.
        const scheduled = nextPaint || now;
        nextPaint =
          scheduled +
          Math.max(1, Math.floor((now - scheduled) / paintInterval) + 1) *
            paintInterval;
        if (!render(frameDelta)) stopTicker();
      };

      const requestRender = () => {
        if (
          destroyed ||
          !activeRef.current ||
          !visible ||
          document.hidden ||
          ticking
        )
          return;
        ticking = true;
        firstTick = true;
        pendingDelta = 0;
        nextPaint = 0;
        gsap.ticker.add(tick);
      };
      const reset = () => {
        Object.assign(target, DEFAULT_LIGHT);
        if (reducedMotion) Object.assign(current, DEFAULT_LIGHT);
        requestRender();
      };
      const onPreferenceChange = () => {
        reducedMotion = preference.matches;
        setMotionReduced(reducedMotion);
        if (reducedMotion) {
          elapsed = 0;
          Object.assign(current, DEFAULT_LIGHT);
        }
        reset();
      };
      const onVisibilityChange = () => {
        if (document.hidden) {
          stopTicker();
        } else requestRender();
      };
      const onContextLost = (event: Event) => {
        event.preventDefault();
        stopTicker();
        rendererRef.current = null;
        setStatus("fallback");
      };
      const onContextRestored = () =>
        setContextVersion((version) => version + 1);
      const visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting && entry.intersectionRatio > 0;
          if (visible) {
            startRenderer();
            requestRender();
          } else stopTicker();
        },
        { threshold: Number.EPSILON },
      );

      visibilityObserver.observe(stage);
      preference.addEventListener("change", onPreferenceChange);
      document.addEventListener("visibilitychange", onVisibilityChange);
      canvas.addEventListener("webglcontextlost", onContextLost);
      canvas.addEventListener("webglcontextrestored", onContextRestored);

      const initialize = async () => {
        const family =
          getComputedStyle(stage).getPropertyValue("--font-inter").trim() ||
          "sans-serif";
        await document.fonts.load(`900 270px ${family}`, "Tomoyo");
        await document.fonts.ready;
        if (destroyed) return;

        const gl = canvas.getContext("webgl", {
          alpha: true,
          antialias: false,
          premultipliedAlpha: true,
          preserveDrawingBuffer: true,
          powerPreference: "low-power",
        });
        if (compact && gl) {
          const contextLoss = gl.getExtension("WEBGL_lose_context");
          releaseContext = () => {
            // Effect replay and context restoration reuse the connected canvas.
            // Release only a removed preview, after React finishes its commit.
            queueMicrotask(() => {
              if (!canvas.isConnected) contextLoss?.loseContext();
            });
          };
        }
        if (!gl) {
          setStatus("fallback");
          return;
        }
        const shaders: WebGLShader[] = [];
        const textures: WebGLTexture[] = [];
        let buffer: WebGLBuffer | null = null;
        let program: WebGLProgram | null = null;
        let resizeObserver: ResizeObserver | undefined;
        cleanupRenderer = () => {
          resizeObserver?.disconnect();
          textures.forEach((texture) => gl.deleteTexture(texture));
          shaders.forEach((shader) => gl.deleteShader(shader));
          if (buffer) gl.deleteBuffer(buffer);
          if (program) gl.deleteProgram(program);
        };

        try {
          shaders.push(compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
          shaders.push(
            compileShader(gl, gl.FRAGMENT_SHADER, metallicTextFragmentShader),
          );
          program = gl.createProgram();
          if (!program) throw new Error("Program allocation failed");
          shaders.forEach((shader) => gl.attachShader(program!, shader));
          gl.linkProgram(program);
          if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw new Error("Shader program could not link");
          gl.useProgram(program);
          buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW,
          );
          const position = gl.getAttribLocation(program, "a_position");
          gl.enableVertexAttribArray(position);
          gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

          // Match the 1328 × 430 pen effect layer and its Inter text node.
          const mask = document.createElement("canvas");
          const rasterScale = compact ? 1 : MASK_SCALE;
          mask.width = MASK_WIDTH * rasterScale;
          mask.height = MASK_HEIGHT * rasterScale;
          const context = mask.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error("Text silhouette unavailable");
          // Keep the pen layer's logical coordinates while sampling each contour
          // at twice the resolution, including on standard-density displays.
          context.scale(rasterScale, rasterScale);
          context.font = `900 270px ${family}`;
          context.letterSpacing = "-16px";
          context.fillStyle = "#fff";
          context.textAlign = "center";
          context.textBaseline = "alphabetic";
          const metrics = context.measureText("Tomoyo");
          const ascent = metrics.fontBoundingBoxAscent;
          const descent = metrics.fontBoundingBoxDescent;
          const baseline = (MASK_HEIGHT - ascent - descent) / 2 + ascent;
          context.fillText("Tomoyo", MASK_WIDTH / 2, baseline);

          const surfaceWidth = MASK_WIDTH * SURFACE_SCALE;
          const surfaceHeight = MASK_HEIGHT * SURFACE_SCALE;
          let surface =
            cachedSurface?.family === family ? cachedSurface.pixels : null;
          if (!surface) {
            const small = document.createElement("canvas");
            small.width = surfaceWidth;
            small.height = surfaceHeight;
            const smallContext = small.getContext("2d", {
              willReadFrequently: true,
            });
            if (!smallContext) throw new Error("Text surface unavailable");
            smallContext.drawImage(mask, 0, 0, small.width, small.height);
            surface = await createTextSurface(
              smallContext.getImageData(0, 0, small.width, small.height),
              () => !destroyed && !gl.isContextLost(),
            );
            if (!surface || destroyed) return;
            cachedSurface = { family, pixels: surface };
          }
          if (destroyed || gl.isContextLost()) return;

          function allocateTexture(unit: number, filter: number) {
            const texture = gl!.createTexture();
            if (!texture) throw new Error("Texture allocation failed");
            textures.push(texture);
            gl!.activeTexture(gl!.TEXTURE0 + unit);
            gl!.bindTexture(gl!.TEXTURE_2D, texture);
            gl!.texParameteri(
              gl!.TEXTURE_2D,
              gl!.TEXTURE_WRAP_S,
              gl!.CLAMP_TO_EDGE,
            );
            gl!.texParameteri(
              gl!.TEXTURE_2D,
              gl!.TEXTURE_WRAP_T,
              gl!.CLAMP_TO_EDGE,
            );
            gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, filter);
            gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, filter);
          }
          allocateTexture(0, gl.LINEAR);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            mask,
          );
          gl.uniform1i(gl.getUniformLocation(program, "u_content"), 0);
          allocateTexture(1, gl.LINEAR);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            surfaceWidth,
            surfaceHeight,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            surface,
          );
          gl.uniform1i(gl.getUniformLocation(program, "u_shape"), 1);
          gl.uniform2f(
            gl.getUniformLocation(program, "u_surfaceTexel"),
            1 / surfaceWidth,
            1 / surfaceHeight,
          );
          const time = gl.getUniformLocation(program, "u_time");
          const mouse = gl.getUniformLocation(program, "u_mouse");
          const resolution = gl.getUniformLocation(program, "u_resolution");
          gl.clearColor(0, 0, 0, 0);

          render = (deltaSeconds = 0) => {
            if (destroyed || gl.isContextLost()) return false;
            const moving =
              activeRef.current && !pausedRef.current && !reducedMotion;
            if (moving) elapsed += deltaSeconds;
            const goal = reducedMotion ? DEFAULT_LIGHT : target;
            const smoothing =
              activeRef.current && !pausedRef.current
                ? 1 - Math.exp(-8 * deltaSeconds)
                : 0;
            current.x += (goal.x - current.x) * smoothing;
            current.y += (goal.y - current.y) * smoothing;
            gl.uniform2f(mouse, current.x, current.y);
            gl.uniform1f(time, reducedMotion ? 0 : elapsed);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            return moving;
          };
          const resize = () => {
            const bounds = stage.getBoundingClientRect();
            const ratio = Math.min(
              compact ? 1.5 : 2,
              Math.sqrt(2_400_000 / (bounds.width * bounds.height)),
              4096 / bounds.width,
              4096 / bounds.height,
            );
            const width = Math.max(1, Math.round(bounds.width * ratio));
            const height = Math.max(1, Math.round(bounds.height * ratio));
            if (canvas.width !== width || canvas.height !== height) {
              canvas.width = width;
              canvas.height = height;
            }
            // Effect replay can reuse a sized canvas with a new GL program.
            // Uniforms belong to that program, so initialize them regardless.
            gl.viewport(0, 0, width, height);
            gl.uniform2f(resolution, width, height);
            // Retain a complete resting frame even when resized offscreen.
            if (render()) requestRender();
          };
          rendererRef.current = {
            setActive: (enabled) => {
              if (enabled) requestRender();
              else stopTicker();
            },
            setPaused: (value) => {
              pausedRef.current = value;
              if (value) stopTicker();
              else requestRender();
            },
            move: (x, y) => {
              if (reducedMotion || pausedRef.current || !activeRef.current)
                return;
              target.x = Math.max(0, Math.min(1, x));
              target.y = Math.max(0, Math.min(1, y));
              requestRender();
            },
            nudge: (x, y) => {
              if (reducedMotion || pausedRef.current || !activeRef.current)
                return;
              target.x = Math.max(0, Math.min(1, target.x + x));
              target.y = Math.max(0, Math.min(1, target.y + y));
              requestRender();
            },
            reset,
          };
          resizeObserver = new ResizeObserver(resize);
          resizeObserver.observe(stage);
          resize();
          rendererRef.current.setActive(activeRef.current);
          setStatus("ready");
        } catch {
          cleanupRenderer();
          cleanupRenderer = undefined;
          rendererRef.current = null;
          setStatus("fallback");
        }
      };
      startRenderer = () => {
        if (initializationStarted || destroyed) return;
        initializationStarted = true;
        void initialize().catch(() => {
          if (!destroyed) setStatus("fallback");
        });
      };

      return () => {
        destroyed = true;
        stopTicker();
        rendererRef.current = null;
        visibilityObserver.disconnect();
        preference.removeEventListener("change", onPreferenceChange);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        canvas.removeEventListener("webglcontextrestored", onContextRestored);
        cleanupRenderer?.();
        releaseContext?.();
      };
    },
    {
      scope: stageRef,
      dependencies: [contextVersion, compact],
      revertOnUpdate: true,
    },
  );

  return (
    <div className={`${styles.effect} ${compact ? styles.compact : ""}`}>
      <div
        ref={stageRef}
        className={styles.stage}
        tabIndex={compact ? undefined : 0}
        role="group"
        aria-label="Interactive metallic Tomoyo text"
        aria-describedby={descriptionId}
        data-state={status}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          rendererRef.current?.move(
            (event.clientX - bounds.left) / bounds.width,
            1 - (event.clientY - bounds.top) / bounds.height,
          );
        }}
        onPointerLeave={() => {
          if (!compact) rendererRef.current?.reset();
        }}
        onKeyDown={(event) => {
          if (compact) return;
          const directions: Record<string, [number, number]> = {
            ArrowLeft: [-0.08, 0],
            ArrowRight: [0.08, 0],
            ArrowUp: [0, 0.08],
            ArrowDown: [0, -0.08],
          };
          const direction = directions[event.key];
          if (direction) {
            event.preventDefault();
            rendererRef.current?.nudge(...direction);
          } else if (event.key === "Home") {
            event.preventDefault();
            rendererRef.current?.reset();
          }
        }}
      >
        <span className={styles.accessibleText}>Tomoyo</span>
        <span className={styles.fallback} aria-hidden="true">
          Tomoyo
        </span>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <p id={descriptionId} className={styles.accessibleText}>
          {status === "fallback"
            ? "Static text preview. Interactive rendering is unavailable."
            : "Liquid chrome flows across the text. Move your pointer or use the arrow keys to tilt the reflections. Home resets the light. Use the pause button to stop the animation. Reduced-motion settings use a fixed reflection."}
        </p>
      </div>
      {!compact && (
        <div className={styles.meta}>
          <p>
            {status === "fallback"
              ? "Static preview · interactive rendering unavailable."
              : motionReduced
                ? "A still reflection, following your motion preference."
                : "Liquid chrome. Move your pointer to tilt the light."}
          </p>
          <div className={styles.controls}>
            <button
              type="button"
              aria-label={
                paused ? "Play metallic animation" : "Pause metallic animation"
              }
              title={
                motionReduced
                  ? "Animation disabled by reduced-motion preference"
                  : paused
                    ? "Play animation"
                    : "Pause animation"
              }
              aria-pressed={paused}
              disabled={status !== "ready" || motionReduced}
              onClick={() => {
                const nextPaused = !paused;
                rendererRef.current?.setPaused(nextPaused);
                setPaused(nextPaused);
              }}
            >
              {paused ? (
                <Play size={15} aria-hidden="true" />
              ) : (
                <Pause size={15} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              aria-label="Reset metallic light"
              title="Reset light"
              onClick={() => rendererRef.current?.reset()}
              disabled={status !== "ready" || motionReduced || paused}
            >
              <RotateCcw size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
