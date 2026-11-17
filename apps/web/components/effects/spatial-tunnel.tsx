"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Pause, Play } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { SPATIAL_TUNNEL_FRAGMENT } from "./shaders/spatial-tunnel";
import styles from "./spatial-tunnel.module.css";

gsap.registerPlugin(useGSAP);

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const JOURNEY_DURATION = 10;
const JOURNEY_ADVANCE = 7.2;

function subscribeToMotionPreference(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const getServerMotionPreference = () => false;

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
    throw new Error("Tunnel shader could not compile");
  }
  return shader;
}

function TunnelFallback() {
  return (
    <svg viewBox="0 0 1440 918" fill="none" aria-hidden="true">
      {Array.from({ length: 14 }, (_, index) => {
        const size = 640 * Math.pow(0.86, index);
        return (
          <rect
            key={index}
            x={1080 - size / 2}
            y={530 - size / 2}
            width={size}
            height={size}
            rx={size * 0.085}
            stroke={index % 3 === 0 ? "#1330b9" : "#254bff"}
            strokeWidth={Math.max(3, size * 0.057)}
            transform={`rotate(${26 + index * 5} 1080 530)`}
          />
        );
      })}
    </svg>
  );
}

export function SpatialTunnel({
  variant = "homepage",
  active = true,
  onStatusChange,
}: {
  variant?: "homepage" | "catalog";
  active?: boolean;
  onStatusChange?: (status: "loading" | "ready" | "fallback") => void;
} = {}) {
  const compact = variant === "catalog";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef({ active, paused: false, reduced: false });
  const requestRenderRef = useRef<(() => void) | null>(null);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );
  const [contextVersion, setContextVersion] = useState(0);
  const descriptionId = useId();
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    getServerMotionPreference,
  );

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    playbackRef.current = { active, paused, reduced: reducedMotion };
    requestRenderRef.current?.();
  }, [active, paused, reducedMotion]);

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      if (!canvas || !stage) return;

      let disposed = false;
      let release: (() => void) | undefined;
      let releaseContext: (() => void) | undefined;

      const initialize = () => {
        if (disposed) return;
        // Keep intrinsic bitmap dimensions out of CSS layout calculations.
        canvas.width = 1;
        canvas.height = 1;
        const gl = canvas.getContext("webgl", {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          preserveDrawingBuffer: false,
          powerPreference: compact ? "low-power" : "high-performance",
        });
        if (!gl) throw new Error("WebGL unavailable");
        if (compact) {
          const contextLoss = gl.getExtension("WEBGL_lose_context");
          releaseContext = () => {
            // Replayed effects may initialize this same connected canvas again.
            queueMicrotask(() => {
              if (!canvas.isConnected) contextLoss?.loseContext();
            });
          };
        }

        const shaders: WebGLShader[] = [];
        let program: WebGLProgram | null = null;
        let buffer: WebGLBuffer | null = null;
        let choreography: gsap.core.Timeline | null = null;
        const observers: {
          resize?: ResizeObserver;
          intersection?: IntersectionObserver;
        } = {};
        let ticking = false;
        let visible = true;
        let contextLost = false;
        let lastTick = 0;
        let nextPaint = 0;
        let elapsed = 0;
        const paintInterval = 1 / (compact ? 30 : 60);
        const refreshTolerance = Math.min(0.004, paintInterval / 8);

        const stop = () => {
          gsap.ticker.remove(draw);
          ticking = false;
          lastTick = 0;
          nextPaint = 0;
        };
        const canDraw = () =>
          !disposed && !contextLost && visible && !document.hidden;
        const isAnimating = () =>
          playbackRef.current.active &&
          !playbackRef.current.paused &&
          !playbackRef.current.reduced;
        const onVisibilityChange = () => {
          if (document.hidden) stop();
          else requestRenderRef.current?.();
        };
        const onContextLost = (event: Event) => {
          event.preventDefault();
          contextLost = true;
          stop();
          setStatus("fallback");
        };
        const onContextRestored = () =>
          setContextVersion((version) => version + 1);

        release = () => {
          stop();
          choreography?.kill();
          observers.resize?.disconnect();
          observers.intersection?.disconnect();
          requestRenderRef.current = null;
          document.removeEventListener("visibilitychange", onVisibilityChange);
          canvas.removeEventListener("webglcontextlost", onContextLost);
          canvas.removeEventListener("webglcontextrestored", onContextRestored);
          shaders.forEach((shader) => gl.deleteShader(shader));
          if (buffer) gl.deleteBuffer(buffer);
          if (program) gl.deleteProgram(program);
        };

        shaders.push(compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
        shaders.push(
          compileShader(gl, gl.FRAGMENT_SHADER, SPATIAL_TUNNEL_FRAGMENT),
        );
        program = gl.createProgram();
        if (!program) throw new Error("Shader program unavailable");
        shaders.forEach((shader) => gl.attachShader(program!, shader));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
          throw new Error("Tunnel shader could not link");
        gl.useProgram(program);
        buffer = gl.createBuffer();
        if (!buffer) throw new Error("Buffer allocation failed");
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
          gl.STATIC_DRAW,
        );
        const position = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        const resolution = gl.getUniformLocation(program, "u_resolution");
        const layout = gl.getUniformLocation(program, "u_layout");
        const mouse = gl.getUniformLocation(program, "u_mouse");
        const time = gl.getUniformLocation(program, "u_time");
        const journeyUniform = gl.getUniformLocation(program, "u_journey");
        const energyUniform = gl.getUniformLocation(program, "u_energy");
        gl.uniform1f(gl.getUniformLocation(program, "u_speed"), 1);
        gl.uniform1f(gl.getUniformLocation(program, "u_rotation"), 0.28);
        gl.uniform1f(gl.getUniformLocation(program, "u_travel"), 0.8);
        gl.uniform1f(gl.getUniformLocation(program, "u_phase"), -1);
        gl.uniform1f(gl.getUniformLocation(program, "u_preview"), -1);
        gl.uniform1f(
          gl.getUniformLocation(program, "u_compact"),
          compact ? 1 : 0,
        );

        const journey = {
          distance: 0,
          roll: 0,
          lightDepth: 30,
          light: 0,
          energy: 0,
        };
        if (!compact) {
          // The same paused timeline is sampled by the visibility-gated ticker.
          // Its eased displacement sits on top of continuous forward travel:
          // gather, accelerate through two portals, then let the space breathe.
          choreography = gsap
            .timeline({ paused: true })
            .to(
              journey,
              {
                distance: JOURNEY_ADVANCE,
                duration: 4.6,
                ease: "sine.inOut",
              },
              1.0,
            )
            .to(journey, { energy: 1, duration: 1.8, ease: "power2.inOut" }, 1)
            .to(journey, { energy: 0, duration: 3.2, ease: "power2.out" }, 2.8)
            .to(journey, { roll: 0.22, duration: 2.3, ease: "sine.inOut" }, 1)
            .to(journey, { roll: 0, duration: 3.5, ease: "sine.inOut" }, 3.3)
            .to(
              journey,
              { lightDepth: -6, duration: 4.5, ease: "sine.inOut" },
              1,
            )
            .to(journey, { light: 1, duration: 1.4, ease: "power2.inOut" }, 1)
            .to(journey, { light: 0, duration: 1.8, ease: "power2.out" }, 4)
            .set(journey, { energy: 0 }, JOURNEY_DURATION);
        }

        const paint = () => {
          if (disposed || contextLost) return;
          const clock = playbackRef.current.reduced ? 0 : elapsed;
          if (choreography) {
            const cycle = Math.floor(clock / JOURNEY_DURATION);
            choreography.time(clock - cycle * JOURNEY_DURATION, true);
            gl.uniform4f(
              journeyUniform,
              clock * 0.46 + cycle * JOURNEY_ADVANCE + journey.distance,
              clock * 0.085 + journey.roll,
              journey.lightDepth,
              journey.light,
            );
            gl.uniform1f(energyUniform, journey.energy);
          }
          gl.uniform2f(resolution, canvas.width, canvas.height);
          gl.uniform2f(mouse, canvas.width * 0.5, canvas.height * 0.5);
          gl.uniform1f(time, clock);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        };

        function draw(now: number) {
          if (!canDraw()) {
            stop();
            return;
          }
          const animating = isAnimating();
          const delta = lastTick ? Math.min(now - lastTick, 0.1) : 0;
          lastTick = now;
          if (animating) elapsed += delta;
          // Keep the original cadence while accepting small refresh jitter.
          // A 1ms window can turn alternate 30Hz paints into 16/50ms pairs;
          // this bounded window never advances the deadline by extra frames.
          if (!animating || now + refreshTolerance >= nextPaint) {
            paint();
            const scheduled = nextPaint || now;
            nextPaint =
              scheduled +
              Math.max(1, Math.floor((now - scheduled) / paintInterval) + 1) *
                paintInterval;
          }
          if (!animating) stop();
        }

        requestRenderRef.current = () => {
          if (!canDraw()) return;
          if (!playbackRef.current.active) {
            stop();
            return;
          }
          if (!isAnimating()) {
            stop();
            paint();
          } else if (!ticking) {
            ticking = true;
            gsap.ticker.add(draw);
          }
        };

        const resize = () => {
          const bounds = stage.getBoundingClientRect();
          if (
            !Number.isFinite(bounds.width) ||
            !Number.isFinite(bounds.height) ||
            bounds.width < 1 ||
            bounds.height < 1
          )
            return;
          // Shader coordinates remain proportional; cap GPU work independently of display size.
          const ratio = Math.min(
            window.devicePixelRatio || 1,
            1,
            Math.sqrt(1_400_000 / (bounds.width * bounds.height)),
          );
          const width = Math.max(1, Math.round(bounds.width * ratio));
          const height = Math.max(1, Math.round(bounds.height * ratio));
          gl.uniform2f(layout, bounds.width, bounds.height);
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);
          }
          // Paint resized buffers once, even offscreen; only animation is visibility-gated.
          paint();
          requestRenderRef.current?.();
        };

        observers.resize = new ResizeObserver(resize);
        observers.resize.observe(stage);
        observers.intersection = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting && entry.intersectionRatio > 0;
            if (visible) requestRenderRef.current?.();
            else stop();
          },
          // A zero threshold treats edge contact as intersecting and may not
          // notify again at the first visible pixel when scrolling back.
          { threshold: Number.EPSILON },
        );
        observers.intersection.observe(stage);
        document.addEventListener("visibilitychange", onVisibilityChange);
        canvas.addEventListener("webglcontextlost", onContextLost);
        canvas.addEventListener("webglcontextrestored", onContextRestored);
        resize();
        setStatus("ready");
      };

      Promise.resolve()
        .then(initialize)
        .catch(() => {
          if (!disposed) setStatus("fallback");
          release?.();
        });

      return () => {
        disposed = true;
        release?.();
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
    <div
      ref={stageRef}
      className={`${styles.stage} ${compact ? styles.compact : ""}`}
      data-state={status}
      role="group"
      aria-label="Spatial Tunnel preview"
      aria-describedby={descriptionId}
    >
      <div className={styles.fallback} aria-hidden="true">
        <TunnelFallback />
      </div>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <p className={styles.srOnly} id={descriptionId}>
        {status === "fallback"
          ? "A static blue geometric tunnel preview. Interactive rendering is unavailable."
          : reducedMotion
            ? "A blue geometric tunnel with a fixed viewpoint. Reduced motion is enabled."
            : "An animated blue geometric tunnel. Use the animation control to pause or resume."}
      </p>
      {!compact && status !== "fallback" && (
        <button
          type="button"
          className={styles.playback}
          disabled={status !== "ready" || reducedMotion}
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          aria-label={
            reducedMotion
              ? "Animation disabled by reduced motion preference"
              : paused
                ? "Play tunnel animation"
                : "Pause tunnel animation"
          }
        >
          {paused || reducedMotion ? (
            <Play aria-hidden="true" fill="currentColor" strokeWidth={0} />
          ) : (
            <Pause aria-hidden="true" fill="currentColor" strokeWidth={0} />
          )}
        </button>
      )}
    </div>
  );
}
