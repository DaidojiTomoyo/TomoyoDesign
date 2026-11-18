import { ArrowUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { HoverGallery } from "@/components/effects/hover-gallery";
import { ImageFocus } from "@/components/effects/image-focus";
import { MetallicText } from "@/components/effects/metallic-text";
import { ScrollBloom } from "@/components/effects/scroll-bloom";
import { SpatialTunnel } from "@/components/effects/spatial-tunnel";
import { GitHubPlaceholder, SiteHeader } from "@/components/home/site-header";
import { componentsBySlug } from "@/lib/catalog";
import styles from "./home.module.css";

function Arrow({ up = false }: { up?: boolean }) {
  const Icon = up ? ArrowUp : ArrowUpRight;
  return (
    <Icon className={up ? styles.arrowUp : styles.arrow} aria-hidden="true" />
  );
}

const steps = [
  {
    number: "01",
    title: "Choose a component",
    copy: "Preview demos and choose a component.",
  },
  {
    number: "02",
    title: "Customize the style",
    copy: "Adjust text, colors, size, and motion.",
  },
  {
    number: "03",
    title: "Use the source",
    copy: "Add the component source to your project.",
  },
];

export default function HomePage() {
  return (
    <div id="top" className={styles.home}>
      <ScrollBloom />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <main id="main" tabIndex={-1}>
        <section className={styles.opening} aria-labelledby="hero-title">
          <SiteHeader />
          <div className={styles.heroContent}>
            <h1 id="hero-title" data-bloom-exclusion="text">
              UI COMPONENTS
              <br />
              &amp; EFFECTS.
            </h1>
            <div className={styles.heroIntro} data-bloom-exclusion>
              <p className={styles.heroLead}>Interactive UI components.</p>
              <p className={styles.heroDescription}>
                Preview text animations, image interactions, and background
                effects. Choose a component to make your own.
              </p>
              <Link className={styles.primaryButton} href="/components">
                Browse components <Arrow />
              </Link>
            </div>
          </div>
          <div className={styles.heroScene}>
            <SpatialTunnel />
          </div>
          <div className={styles.heroCaption}>
            <span data-bloom-exclusion>
              {componentsBySlug["spatial-tunnel"].name}
            </span>
          </div>
        </section>

        <div className={styles.collection}>
          <section
            className={styles.section}
            id="components"
            aria-labelledby="metallic-title"
          >
            <div className={styles.collectionHeading}>
              <h2 id="metallic-title" data-bloom-exclusion>
                {componentsBySlug["metallic-text"].name}
              </h2>
              <Link
                className={styles.textLink}
                href="/components"
                data-bloom-exclusion
              >
                Explore more effects <Arrow />
              </Link>
            </div>
            <div
              id="metallic-text"
              className={styles.metalStage}
              data-bloom-surface
            >
              <MetallicText />
            </div>
          </section>
          <section
            className={`${styles.section} ${styles.gallerySection}`}
            id="hover-gallery"
            aria-labelledby="gallery-title"
          >
            <div className={styles.galleryHeading}>
              <h2 id="gallery-title" data-bloom-exclusion>
                {componentsBySlug["hover-gallery"].name}
              </h2>
              <p data-bloom-exclusion>Hover over an image to expand it.</p>
            </div>
            <div className={styles.galleryMedia} data-bloom-surface>
              <HoverGallery />
            </div>
            <div className={styles.galleryCaption}>
              <span data-bloom-exclusion>FORM Objects · Home collection</span>
              <a
                className={styles.textLink}
                href="#examples"
                data-bloom-exclusion
              >
                See it in context <Arrow />
              </a>
            </div>
          </section>
        </div>

        <section
          className={styles.exampleSection}
          id="examples"
          aria-labelledby="focus-title"
        >
          <div className={styles.section}>
            <div className={styles.exampleHeading}>
              <h2 id="focus-title" data-bloom-exclusion>
                {componentsBySlug["image-focus"].name}
              </h2>
              <div className={styles.exampleNote} data-bloom-exclusion>
                <p>See every detail.</p>
                <span>A closer look at product photos and creative work.</span>
              </div>
            </div>
            <div
              id="image-focus"
              className={styles.exampleFrame}
              data-bloom-surface
            >
              <ImageFocus />
            </div>
            <p className={styles.exampleCaption} data-bloom-exclusion="text">
              FORM Objects · Furniture website concept
            </p>
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.howSection}`}
          id="how-to-use"
          aria-labelledby="how-title"
        >
          <div className={styles.workflowHeading}>
            <h2 id="how-title" data-bloom-exclusion>
              How to use
            </h2>
            <Link
              className={styles.textLink}
              href="/components"
              data-bloom-exclusion
            >
              Start with a component <Arrow />
            </Link>
          </div>
          <ol className={styles.steps}>
            {steps.map((step) => (
              <li key={step.number} data-bloom-exclusion>
                <div className={styles.stepTitle}>
                  <span>{step.number}</span>
                  <h3>{step.title}</h3>
                </div>
                <p>{step.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <div className={styles.closingInner}>
            <div data-bloom-exclusion>
              <h2 id="closing-title">Explore the component library.</h2>
              <p>
                Find text animations, background effects, and interactive
                components.
              </p>
            </div>
            <Link
              className={styles.whiteButton}
              href="/components"
              data-bloom-exclusion
            >
              Browse components <Arrow />
            </Link>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <p data-bloom-exclusion>Interactive components for the web.</p>
          <nav aria-label="Footer navigation" data-bloom-exclusion>
            <Link href="/components">Components</Link>
            <a href="#examples">Examples</a>
            <a href="#how-to-use">How to use</a>
            <GitHubPlaceholder />
          </nav>
        </div>
        <a
          href="#top"
          className={styles.footerWordmark}
          aria-label="TomoyoDesign home"
          data-bloom-exclusion="text"
        >
          TomoyoDesign
        </a>
        <div className={styles.footerBottom}>
          <span data-bloom-exclusion>TOMOYO DESIGN</span>
          <a href="#top" data-bloom-exclusion>
            Back to top <Arrow up />
          </a>
        </div>
      </footer>
    </div>
  );
}
