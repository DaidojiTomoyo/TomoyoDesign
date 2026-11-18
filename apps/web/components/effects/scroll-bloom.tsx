"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useRef } from "react";

import type {
  createScrollBloomRenderer,
  SakuraViewport,
} from "./shaders/scroll-bloom";
import styles from "./scroll-bloom.module.css";

gsap.registerPlugin(useGSAP);

type BloomRenderer = ReturnType<typeof createScrollBloomRenderer>;
type BloomLayout = NonNullable<SakuraViewport["layout"]>;

export function ScrollBloom() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      const poster = posterRef.current;
      const home = root?.closest<HTMLElement>("#top");
      if (!root || !canvas || !poster || !home) return;

      gsap.registerPlugin(ScrollTrigger);

      const growth = { progress: 0 };
      let renderer: BloomRenderer | null = null;
      let timeline: gsap.core.Timeline | null = null;
      let disposed = false;
      let initializing = false;
      let prepared = false;
      let failed = false;
      let contextLost = false;
      let reduced = false;
      let width = 0;
      let height = 0;
      let pixelRatio = 1;
      let pageWidth = 0;
      let pageHeight = 0;
      let homeDocumentTop = 0;
      let layout: BloomLayout = { clearances: [] };
      let resized = true;
      let lastProgress = Number.NaN;
      let lastScrollY = Number.NaN;
      let refreshTimer: number | undefined;
      let idleRequest: number | undefined;
      let prepareTimer: number | undefined;
      let paintRequest: number | undefined;

      const measureLayout = () => {
        const bounds = home.getBoundingClientRect();
        const nextWidth = document.documentElement.clientWidth;
        const nextHeight = window.innerHeight;
        const nextPixelRatio = window.devicePixelRatio || 1;
        resized ||=
          width !== nextWidth ||
          height !== nextHeight ||
          pixelRatio !== nextPixelRatio;
        width = nextWidth;
        height = nextHeight;
        pixelRatio = nextPixelRatio;
        pageWidth = bounds.width;
        pageHeight = bounds.height;
        homeDocumentTop = bounds.top + window.scrollY;
        if (pageWidth < 1 || pageHeight < 1) return;

        // Measure the composition once per layout. The authored branches must
        // stay outside complete demo surfaces, not disappear into white panels.
        const clearances = Array.from(
          home.querySelectorAll<HTMLElement>(
            "[data-bloom-exclusion], header > *, [aria-label='Spatial Tunnel preview'] > button",
          ),
        )
          .filter((element) => !element.closest("[data-bloom-surface]"))
          .map((element) => {
            let rect: DOMRect;
            if (element.dataset.bloomExclusion === "text") {
              const range = document.createRange();
              range.selectNodeContents(element);
              rect = range.getBoundingClientRect();
            } else {
              rect = element.getBoundingClientRect();
            }
            return {
              x: rect.left - bounds.left,
              y: rect.top - bounds.top,
              width: rect.width,
              height: rect.height,
            };
          })
          .filter((rect) => rect.width > 0 && rect.height > 0);
        const surfaces = Array.from(
          home.querySelectorAll<HTMLElement>("[data-bloom-surface]"),
        ).map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            x: rect.left - bounds.left,
            y: rect.top - bounds.top,
            width: rect.width,
            height: rect.height,
          };
        });
        layout = { clearances, surfaces, viewportHeight: height };
      };

      const paint = (force = false) => {
        if (
          !renderer ||
          disposed ||
          contextLost ||
          reduced ||
          document.hidden ||
          width < 1 ||
          height < 1 ||
          pageWidth < 1 ||
          pageHeight < 1
        )
          return;

        const scrollY = window.scrollY - homeDocumentTop;
        try {
          if (resized) {
            renderer.resize(width, height, pixelRatio);
            resized = false;
            force = true;
          }
          if (
            force ||
            growth.progress !== lastProgress ||
            scrollY !== lastScrollY
          ) {
            renderer.render(growth.progress, {
              scrollY,
              pageWidth,
              pageHeight,
              layout,
            });
            lastProgress = growth.progress;
            lastScrollY = scrollY;
            root.dataset.state = "ready";
          }
        } catch {
          renderer.dispose();
          renderer = null;
          failed = true;
          root.dataset.state = "fallback";
        }
      };

      const prepare = async () => {
        if (
          !prepared ||
          disposed ||
          initializing ||
          renderer ||
          failed ||
          contextLost ||
          reduced ||
          document.hidden
        )
          return;

        initializing = true;
        try {
          const { createScrollBloomRenderer, loadSakuraMaterials } =
            await import("./shaders/scroll-bloom");
          const materials = await loadSakuraMaterials();
          if (disposed || reduced || contextLost || document.hidden) return;
          renderer = createScrollBloomRenderer(canvas, materials);
          resized = true;
          paint(true);
        } catch {
          renderer?.dispose();
          renderer = null;
          failed = true;
          if (!disposed) root.dataset.state = "fallback";
        } finally {
          initializing = false;
        }
      };

      const syncProgress = (trigger = timeline?.scrollTrigger) => {
        if (!trigger) return;
        trigger.update();
        // Direct scrubbing also restores the same state after refresh or resize.
        trigger.animation?.totalProgress(trigger.progress, true);
        growth.progress = trigger.progress;
      };

      const refresh = () => {
        if (disposed) return;
        if (timeline?.scrollTrigger) {
          timeline.scrollTrigger.refresh();
        } else {
          measureLayout();
        }
        syncProgress();
        paint(true);
      };

      const queueRefresh = () => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(refresh, 80);
      };

      const media = gsap.matchMedia();
      media.add(
        {
          animated: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          reduced = Boolean(context.conditions?.reduced);
          root.dataset.motion = reduced ? "reduced" : "scroll";
          measureLayout();
          if (reduced) {
            growth.progress = 1;
            renderer?.dispose();
            renderer = null;
            return;
          }
          if (!failed) root.dataset.state = "loading";

          timeline = gsap.timeline({
            scrollTrigger: {
              trigger: home,
              start: () => homeDocumentTop,
              end: () =>
                Math.max(
                  homeDocumentTop + 1,
                  homeDocumentTop + pageHeight - height,
                ),
              // Geometry and document translation share the same scroll frame.
              // Local growth curves supply easing without a trailing catch-up.
              scrub: true,
              onRefreshInit: measureLayout,
              onRefresh: (trigger) => {
                syncProgress(trigger);
                paint(true);
              },
            },
          });
          timeline.fromTo(
            growth,
            { progress: 0 },
            {
              progress: 1,
              duration: 1,
              ease: "none",
              onUpdate: paint,
            },
          );
          refresh();
          void prepare();

          return () => {
            timeline = null;
          };
        },
      );

      const homeObserver = new ResizeObserver(queueRefresh);
      const onScroll = () => {
        if (paintRequest !== undefined || reduced || document.hidden) return;
        // Translation must repaint even while scrub progress is unchanged.
        paintRequest = window.requestAnimationFrame(() => {
          paintRequest = undefined;
          syncProgress();
          paint();
        });
      };
      const onVisibilityChange = () => {
        if (document.hidden) return;
        syncProgress();
        void prepare();
        paint(true);
      };
      const onContextLost = (event: Event) => {
        event.preventDefault();
        contextLost = true;
        renderer?.dispose();
        renderer = null;
        root.dataset.state = "fallback";
      };
      const onContextRestored = () => {
        contextLost = false;
        failed = false;
        void prepare();
      };
      const beginPreparation = () => {
        prepared = true;
        void prepare();
      };

      // Let the hero paint first; the branch has no continuous render loop.
      if (typeof window.requestIdleCallback === "function") {
        idleRequest = window.requestIdleCallback(beginPreparation, {
          timeout: 450,
        });
      } else {
        prepareTimer = window.setTimeout(beginPreparation, 120);
      }

      homeObserver.observe(home);
      void document.fonts.ready.then(() => {
        if (!disposed) refresh();
      });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", queueRefresh);
      window.addEventListener("pageshow", refresh);
      document.addEventListener("visibilitychange", onVisibilityChange);
      canvas.addEventListener("webglcontextlost", onContextLost);
      canvas.addEventListener("webglcontextrestored", onContextRestored);

      return () => {
        disposed = true;
        media.revert();
        homeObserver.disconnect();
        window.clearTimeout(refreshTimer);
        window.clearTimeout(prepareTimer);
        if (idleRequest !== undefined) window.cancelIdleCallback(idleRequest);
        if (paintRequest !== undefined)
          window.cancelAnimationFrame(paintRequest);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", queueRefresh);
        window.removeEventListener("pageshow", refresh);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        canvas.removeEventListener("webglcontextrestored", onContextRestored);
        renderer?.dispose();
      };
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      id="scroll-bloom"
      className={styles.root}
      data-state="loading"
      aria-hidden="true"
    >
      <picture className={styles.posterFrame}>
        <source
          media="(min-width: 1680px)"
          srcSet="/images/components/sakura-background-1920.png"
        />
        <source
          media="(min-width: 1360px)"
          srcSet="/images/components/sakura-background.png"
        />
        <source
          media="(min-width: 1240px)"
          srcSet="/images/components/sakura-background-1280.png"
        />
        <Image
          ref={posterRef}
          className={styles.poster}
          src="/images/components/sakura-background-1200.png"
          alt=""
          fill
          unoptimized
          loading="lazy"
          sizes="100vw"
          onLoad={() => {
            if (rootRef.current) rootRef.current.dataset.poster = "ready";
          }}
        />
      </picture>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
