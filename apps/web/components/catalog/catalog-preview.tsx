"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Component,
  Suspense,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";

import { componentsBySlug, type ComponentSlug } from "@/lib/catalog";

import styles from "./catalog-preview.module.css";

gsap.registerPlugin(useGSAP);

const MetallicText = dynamic(() =>
  import("../effects/metallic-text").then((module) => module.MetallicText),
);
const SpatialTunnel = dynamic(() =>
  import("../effects/spatial-tunnel").then((module) => module.SpatialTunnel),
);

type PreviewStatus = "loading" | "ready" | "fallback";
type PlaybackControls = { setActive: (active: boolean) => void };

function PreviewPoster({ slug }: { slug: ComponentSlug }) {
  return (
    <Image
      src={componentsBySlug[slug].poster}
      alt=""
      fill
      sizes="(min-width: 1440px) 427px, 360px"
      className={styles.poster}
      draggable={false}
      loading="eager"
    />
  );
}

function PreviewFailure({
  onRetry,
  onRetryFocus,
}: {
  onRetry: () => void;
  onRetryFocus?: () => void;
}) {
  return (
    <div className={styles.feedback} role="status">
      <span>Preview unavailable</span>
      <button
        type="button"
        onClick={() => {
          onRetryFocus?.();
          onRetry();
        }}
      >
        <RotateCcw size={13} aria-hidden="true" />
        Retry preview
      </button>
    </div>
  );
}

class PreviewBoundary extends Component<
  { children: ReactNode; slug: ComponentSlug; onRetryFocus?: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <>
          <PreviewPoster slug={this.props.slug} />
          <PreviewFailure
            onRetry={() => this.setState({ failed: false })}
            onRetryFocus={this.props.onRetryFocus}
          />
        </>
      );
    }
    return this.props.children;
  }
}

const objects = [
  { src: "/images/showcase/ceramic-vase.jpg", position: "50% 52%" },
  { src: "/images/showcase/lounge-chair.jpg", position: "50% 50%" },
  { src: "/images/showcase/table-lamp.jpg", position: "50% 50%" },
];

function GalleryPreview({
  active,
  onStatusChange,
}: {
  active: boolean;
  onStatusChange: (status: PreviewStatus) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(new Set<string>());
  const activeRef = useRef(active);
  const controlsRef = useRef<PlaybackControls | null>(null);
  const [ready, setReady] = useState(false);

  useGSAP(() => {
    activeRef.current = active;
    controlsRef.current?.setActive(active);
  }, [active]);

  useGSAP(
    () => {
      const rail = railRef.current;
      if (!rail || !ready) return;
      const panels = Array.from(rail.children) as HTMLElement[];
      const expand = panels.map((panel) =>
        gsap.quickTo(panel, "flexGrow", {
          duration: 0.65,
          ease: "expo.out",
        }),
      );
      const heights = panels.map((panel) =>
        gsap.quickTo(panel, "height", {
          duration: 0.65,
          ease: "expo.out",
        }),
      );
      const tweens = [...expand, ...heights].map((animate) => animate.tween);
      let selection = 1;
      let started = false;
      let playing = activeRef.current;
      let railHeight = rail.getBoundingClientRect().height;
      const select = (selected: number) => {
        selection = selected;
        panels.forEach((_, index) => {
          expand[index](index === selected ? 3.44 : 1);
          heights[index](railHeight * (index === selected ? 0.95 : 0.76));
        });
      };
      const setActive = (enabled: boolean) => {
        playing = enabled;
        if (enabled && !started) {
          started = true;
          select(selection);
        } else {
          tweens.forEach((tween) => {
            if (!enabled) tween.pause();
            else if (tween.progress() < 1) tween.resume();
          });
        }
      };
      controlsRef.current = { setActive };
      const handlers = panels.map((panel, index) => {
        const handle = () => {
          if (playing) select(index);
        };
        panel.addEventListener("pointerenter", handle);
        return handle;
      });
      setActive(activeRef.current);
      const resize = new ResizeObserver(() => {
        const nextHeight = rail.getBoundingClientRect().height;
        if (nextHeight === railHeight) return;
        railHeight = nextHeight;
        if (!started) return;
        select(selection);
        if (!playing) tweens.forEach((tween) => tween.progress(1).pause());
      });
      resize.observe(rail);
      return () => {
        controlsRef.current = null;
        resize.disconnect();
        panels.forEach((panel, index) =>
          panel.removeEventListener("pointerenter", handlers[index]),
        );
      };
    },
    { scope: railRef, dependencies: [ready], revertOnUpdate: true },
  );

  return (
    <div className={styles.gallery} aria-hidden="true">
      <div ref={railRef} className={styles.galleryRail}>
        {objects.map((object) => (
          <div key={object.src} className={styles.galleryPanel}>
            <Image
              src={object.src}
              alt=""
              fill
              sizes="320px"
              style={{ objectPosition: object.position }}
              draggable={false}
              onLoad={() => {
                loaded.current.add(object.src);
                if (loaded.current.size === objects.length) {
                  setReady(true);
                  onStatusChange("ready");
                }
              }}
              onError={() => onStatusChange("fallback")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FocusPreview({
  active,
  onStatusChange,
}: {
  active: boolean;
  onStatusChange: (status: PreviewStatus) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const activeRef = useRef(active);
  const controlsRef = useRef<PlaybackControls | null>(null);
  const [ready, setReady] = useState(false);

  useGSAP(() => {
    activeRef.current = active;
    controlsRef.current?.setActive(active);
  }, [active]);

  useGSAP(
    () => {
      const stage = stageRef.current;
      const image = imageRef.current;
      if (!stage || !image || !ready) return;
      const zoom = gsap.to(image, {
        scaleX: 1.32,
        scaleY: 1.32,
        duration: 0.5,
        ease: "expo.out",
        paused: true,
      });
      const xTo = gsap.quickTo(image, "xPercent", {
        duration: 0.18,
        ease: "expo.out",
      });
      const yTo = gsap.quickTo(image, "yPercent", {
        duration: 0.18,
        ease: "expo.out",
      });
      let playing = activeRef.current;
      const tweens = [zoom, xTo.tween, yTo.tween];
      const startedTweens = new Set([zoom]);
      const setActive = (enabled: boolean) => {
        playing = enabled;
        tweens.forEach((tween) => {
          if (!enabled) tween.pause();
          else if (startedTweens.has(tween) && tween.progress() < 1)
            tween.resume();
        });
      };
      controlsRef.current = { setActive };
      const move = (event: PointerEvent) => {
        if (!playing) return;
        const bounds = stage.getBoundingClientRect();
        const x = Math.min(
          1,
          Math.max(0, (event.clientX - bounds.left) / bounds.width),
        );
        const y = Math.min(
          1,
          Math.max(0, (event.clientY - bounds.top) / bounds.height),
        );
        startedTweens.add(xTo.tween);
        startedTweens.add(yTo.tween);
        xTo((0.5 - x) * 16);
        yTo((0.5 - y) * 16);
      };
      stage.addEventListener("pointermove", move);
      setActive(activeRef.current);
      return () => {
        controlsRef.current = null;
        stage.removeEventListener("pointermove", move);
      };
    },
    { scope: stageRef, dependencies: [ready], revertOnUpdate: true },
  );

  return (
    <div ref={stageRef} className={styles.focus} aria-hidden="true">
      <Image
        ref={imageRef}
        src="/images/showcase/lounge-chair.jpg"
        alt=""
        fill
        sizes="(min-width: 1440px) 427px, 360px"
        draggable={false}
        onLoad={() => {
          setReady(true);
          onStatusChange("ready");
        }}
        onError={() => onStatusChange("fallback")}
      />
    </div>
  );
}

function LivePreview({
  slug,
  active,
  onReady,
  onRetryFocus,
}: {
  slug: ComponentSlug;
  active: boolean;
  onReady: () => void;
  onRetryFocus?: () => void;
}) {
  const [status, setStatus] = useState<PreviewStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const handleStatusChange = useCallback(
    (nextStatus: PreviewStatus) => {
      setStatus(nextStatus);
      if (nextStatus === "ready") onReady();
    },
    [onReady],
  );

  if (status === "fallback") {
    return (
      <>
        <PreviewPoster slug={slug} />
        <PreviewFailure
          onRetryFocus={onRetryFocus}
          onRetry={() => {
            setAttempt((value) => value + 1);
            setStatus("loading");
          }}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={styles.live}
        data-ready={status === "ready"}
        data-static={slug === "hover-gallery" || slug === "image-focus"}
        aria-hidden="true"
      >
        {/* Lazy renderers must not suspend the catalogue's page boundary. */}
        <Suspense fallback={null}>
          {slug === "metallic-text" ? (
            <MetallicText
              key={attempt}
              variant="catalog"
              active={active && status === "ready"}
              onStatusChange={handleStatusChange}
            />
          ) : slug === "spatial-tunnel" ? (
            <SpatialTunnel
              key={attempt}
              variant="catalog"
              active={active && status === "ready"}
              onStatusChange={handleStatusChange}
            />
          ) : slug === "hover-gallery" ? (
            <GalleryPreview
              key={attempt}
              active={active}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <FocusPreview
              key={attempt}
              active={active}
              onStatusChange={handleStatusChange}
            />
          )}
        </Suspense>
      </div>
      {active && status === "loading" && (
        <span className={styles.loading} role="status">
          Loading preview…
        </span>
      )}
    </>
  );
}

export function CatalogPreview({
  slug,
  active,
  onRetryFocus,
}: {
  slug: ComponentSlug;
  active: boolean;
  onRetryFocus?: () => void;
}) {
  const [initialized, setInitialized] = useState(false);
  const handleReady = useCallback(() => setInitialized(true), []);
  const usesCanvas = slug === "metallic-text" || slug === "spatial-tunnel";

  return (
    <div className={styles.preview} data-preview={slug} data-active={active}>
      {usesCanvas && <PreviewPoster slug={slug} />}
      {(!usesCanvas || active || initialized) && (
        <PreviewBoundary slug={slug} onRetryFocus={onRetryFocus}>
          <LivePreview
            slug={slug}
            active={active}
            onReady={handleReady}
            onRetryFocus={onRetryFocus}
          />
        </PreviewBoundary>
      )}
    </div>
  );
}
