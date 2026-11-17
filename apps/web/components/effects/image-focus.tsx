"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import styles from "./image-focus.module.css";

gsap.registerPlugin(useGSAP);

type FocusMotion = {
  point: (x: number, y: number) => void;
  zoom: (zoomed: boolean) => void;
};

const collection = [
  {
    category: "Seating",
    name: "Lounge chair",
    src: "/images/showcase/lounge-chair.jpg",
    alt: "A brushed metal armchair with olive green cushions beside a window",
  },
  {
    category: "Objects",
    name: "Ceramic vase",
    src: "/images/showcase/ceramic-vase.jpg",
    alt: "A light ceramic vase on a softly lit concrete surface",
  },
  {
    category: "Lighting",
    name: "Table lamp",
    src: "/images/showcase/table-lamp.jpg",
    alt: "A metal table lamp with a rounded dome shade",
  },
] as const;

export function ImageFocus() {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const example = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLButtonElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const motion = useRef<FocusMotion | null>(null);
  const focusPoint = useRef({ x: 50, y: 50 });
  const hintId = useId();
  const object = collection[selected]!;

  useGSAP(
    () => {
      const viewportElement = viewport.current;
      const imageElement = image.current;
      if (!viewportElement || !imageElement) return;

      const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
      const origin = { x: 50, y: 50 };
      const updateOrigin = () => {
        viewportElement.style.setProperty("--focus-x", `${origin.x}%`);
        viewportElement.style.setProperty("--focus-y", `${origin.y}%`);
      };
      gsap.set(imageElement, { scale: 1 });
      updateOrigin();

      const scaleXTo = gsap.quickTo(imageElement, "scaleX", {
        duration: 0.5,
        ease: "expo.out",
      });
      const scaleYTo = gsap.quickTo(imageElement, "scaleY", {
        duration: 0.5,
        ease: "expo.out",
      });
      const xTo = gsap.quickTo(origin, "x", {
        duration: 0.18,
        ease: "expo.out",
        onUpdate: updateOrigin,
      });
      const yTo = gsap.quickTo(origin, "y", {
        duration: 0.18,
        ease: "expo.out",
        onUpdate: updateOrigin,
      });
      const updatePreference = () => {
        if (!preference.matches) return;
        if (scaleXTo.tween.isActive()) scaleXTo.tween.progress(1);
        if (scaleYTo.tween.isActive()) scaleYTo.tween.progress(1);
        if (xTo.tween.isActive()) xTo.tween.progress(1);
        if (yTo.tween.isActive()) yTo.tween.progress(1);
      };

      updatePreference();
      motion.current = {
        point: (x, y) => {
          xTo(x);
          yTo(y);
          if (preference.matches) {
            xTo.tween.progress(1);
            yTo.tween.progress(1);
          }
        },
        zoom: (active) => {
          scaleXTo(active ? 1.32 : 1);
          scaleYTo(active ? 1.32 : 1);
          if (preference.matches) {
            scaleXTo.tween.progress(1);
            scaleYTo.tween.progress(1);
          }
        },
      };
      preference.addEventListener("change", updatePreference);

      return () => {
        motion.current = null;
        preference.removeEventListener("change", updatePreference);
        viewportElement.style.removeProperty("--focus-x");
        viewportElement.style.removeProperty("--focus-y");
      };
    },
    { scope: example, dependencies: [selected], revertOnUpdate: true },
  );

  useGSAP(
    () => {
      motion.current?.zoom(zoomed);
    },
    { scope: example, dependencies: [selected, zoomed] },
  );

  function moveFocus(x: number, y: number) {
    focusPoint.current = {
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    };
    motion.current?.point(
      37.5 + focusPoint.current.x * 0.25,
      37.5 + focusPoint.current.y * 0.25,
    );
  }

  function pointFromPointer(event: PointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    moveFocus(
      ((event.clientX - bounds.left) / bounds.width) * 100,
      ((event.clientY - bounds.top) / bounds.height) * 100,
    );
  }

  function chooseObject(index: number) {
    setSelected(index);
    setZoomed(false);
    moveFocus(50, 50);
  }

  function nextObject() {
    chooseObject((selected + 1) % collection.length);
  }

  function navigateImage(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setZoomed(false);
      moveFocus(50, 50);
      return;
    }

    const movement: Record<string, [number, number]> = {
      ArrowLeft: [-10, 0],
      ArrowRight: [10, 0],
      ArrowUp: [0, -10],
      ArrowDown: [0, 10],
    };
    const direction = movement[event.key];
    if (direction) {
      event.preventDefault();
      setZoomed(true);
      moveFocus(
        focusPoint.current.x + direction[0],
        focusPoint.current.y + direction[1],
      );
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFocus(50, 50);
    }
  }

  return (
    <article
      ref={example}
      className={styles.example}
      aria-label="FORM Objects image focus example"
    >
      <header className={styles.header}>
        <span className={styles.wordmark}>form.</span>
        <div
          className={styles.categories}
          role="group"
          aria-label="Select an object category"
        >
          {collection.map((item, index) => (
            <button
              key={item.category}
              type="button"
              className={styles.category}
              aria-pressed={selected === index}
              onClick={() => chooseObject(index)}
            >
              {item.category}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.next}
          onClick={nextObject}
          aria-label="View the next object in the collection"
        >
          View collection{" "}
          <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.introduction}>
          <h3 className={styles.title}>
            Everyday
            <br />
            furniture.
          </h3>
          <p className={styles.copy}>
            Seating, lighting and objects
            <br />
            for the home.
          </p>
          <button
            type="button"
            className={styles.explore}
            onClick={nextObject}
            aria-label="View the next object in the collection"
          >
            View collection{" "}
            <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <figure className={styles.figure}>
          <button
            ref={viewport}
            type="button"
            className={styles.viewport}
            data-zoomed={zoomed}
            aria-label={`${zoomed ? "Close zoom of" : "Zoom into"} ${object.name.toLowerCase()}`}
            aria-pressed={zoomed}
            aria-describedby={hintId}
            onClick={() => setZoomed((current) => !current)}
            onPointerEnter={(event) => {
              if (event.pointerType === "touch") return;
              pointFromPointer(event);
              setZoomed(true);
            }}
            onPointerMove={(event) => {
              if (zoomed) pointFromPointer(event);
            }}
            onPointerLeave={() => {
              setZoomed(false);
              moveFocus(50, 50);
            }}
            onFocus={(event) => {
              if (event.currentTarget.matches(":focus-visible"))
                setZoomed(true);
            }}
            onBlur={() => {
              setZoomed(false);
              moveFocus(50, 50);
            }}
            onKeyDown={navigateImage}
          >
            <Image
              key={object.src}
              ref={image}
              src={object.src}
              alt={object.alt}
              fill
              sizes="858px"
              className={styles.image}
              draggable={false}
            />
          </button>
          <figcaption className={styles.caption}>
            <span id={hintId} className={styles.hint}>
              {zoomed
                ? "Move to explore. Arrow keys pan; Escape closes."
                : "Hover over the image to explore the details."}
            </span>
            <button
              type="button"
              className={styles.zoomToggle}
              onClick={() => {
                moveFocus(50, 50);
                setZoomed((current) => !current);
              }}
              aria-pressed={zoomed}
            >
              {zoomed ? "Reset Image Focus" : "Try Image Focus"}{" "}
              <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </figcaption>
          <span className="sr-only" aria-live="polite">
            {object.name}
          </span>
        </figure>
      </div>
    </article>
  );
}
