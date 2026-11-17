"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";

import styles from "./hover-gallery.module.css";

gsap.registerPlugin(useGSAP);

const objects = [
  {
    name: "Ceramic vase",
    src: "/images/showcase/ceramic-vase.jpg",
    alt: "A light ceramic vase in a softly lit room",
  },
  {
    name: "Lounge chair",
    src: "/images/showcase/lounge-chair.jpg",
    alt: "A metal lounge chair with green upholstered cushions",
  },
  {
    name: "Table lamp",
    src: "/images/showcase/table-lamp.jpg",
    alt: "A brushed metal table lamp with a rounded shade",
  },
] as const;

const focalPositions = [0.16, 0.5, 0.84];

export function HoverGallery() {
  const [activeIndex, setActiveIndex] = useState(1);
  const root = useRef<HTMLDivElement>(null);
  const imageButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const animateSelection = useRef<((index: number) => void) | null>(null);

  useGSAP(
    () => {
      const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
      const motions = imageButtons.current.map((button) => {
        if (!button) return null;
        const active = button.dataset.active === "true";

        // Pin the visible CSS state before data-active changes on selection.
        gsap.set(button, {
          flexGrow: active ? 3.44 : 1,
          height: active ? 390 : 300,
        });
        return {
          grow: gsap.quickTo(button, "flexGrow", {
            duration: 0.65,
            ease: "expo.out",
          }),
          height: gsap.quickTo(button, "height", {
            duration: 0.65,
            ease: "expo.out",
          }),
        };
      });
      const updatePreference = () => {
        if (!preference.matches) return;
        motions.forEach((motion) => {
          if (!motion) return;
          if (motion.grow.tween.isActive()) motion.grow.tween.progress(1);
          if (motion.height.tween.isActive()) motion.height.tween.progress(1);
        });
      };

      updatePreference();
      animateSelection.current = (index) => {
        motions.forEach((motion, buttonIndex) => {
          if (!motion) return;
          motion.grow(buttonIndex === index ? 3.44 : 1);
          motion.height(buttonIndex === index ? 390 : 300);
          if (preference.matches) {
            motion.grow.tween.progress(1);
            motion.height.tween.progress(1);
          }
        });
      };
      preference.addEventListener("change", updatePreference);

      return () => {
        animateSelection.current = null;
        preference.removeEventListener("change", updatePreference);
      };
    },
    { scope: root },
  );

  function select(index: number) {
    if (index === activeIndex) return;
    animateSelection.current?.(index);
    setActiveIndex(index);
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % objects.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + objects.length) % objects.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = objects.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    select(nextIndex);
    imageButtons.current[nextIndex]?.focus({ preventScroll: true });
  }

  return (
    <div ref={root} className={styles.root}>
      <div
        className={styles.gallery}
        role="group"
        aria-label="Interactive furniture gallery"
        onPointerMove={(event) => {
          if (event.pointerType === "touch") return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width;
          const closest = focalPositions.reduce(
            (selected, point, index) =>
              Math.abs(point - x) < Math.abs(focalPositions[selected]! - x)
                ? index
                : selected,
            0,
          );
          select(closest);
        }}
      >
        {objects.map((object, index) => (
          <button
            key={object.src}
            ref={(element) => {
              imageButtons.current[index] = element;
            }}
            type="button"
            className={styles.imageButton}
            data-active={index === activeIndex}
            aria-label={`Expand ${object.name.toLowerCase()}`}
            aria-pressed={index === activeIndex}
            onFocus={() => select(index)}
            onClick={() => select(index)}
            onKeyDown={(event) => navigate(event, index)}
          >
            <Image
              src={object.src}
              alt={object.alt}
              fill
              sizes="688px"
              className={styles.image}
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
