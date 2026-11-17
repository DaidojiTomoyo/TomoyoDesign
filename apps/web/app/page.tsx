import { ArrowUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { HoverGallery } from "@/components/effects/hover-gallery";
import { ImageFocus } from "@/components/effects/image-focus";
import { MetallicText } from "@/components/effects/metallic-text";
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
    <div id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <main id="main" tabIndex={-1}>
        <section className={styles.opening} aria-labelledby="hero-title">
          <SiteHeader />
          <div className={styles.heroContent}>
            <h1 id="hero-title">
              UI COMPONENTS
              <br />
              &amp; EFFECTS.
            </h1>
            <div className={styles.heroIntro}>
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
            <span>{componentsBySlug["spatial-tunnel"].name}</span>
          </div>
        </section>

        <div className={styles.collection}>
          <section
            className={styles.section}
            id="components"
            aria-labelledby="metallic-title"
          >
            <div className={styles.collectionHeading}>
              <h2 id="metallic-title">
                {componentsBySlug["metallic-text"].name}
              </h2>
              <Link className={styles.textLink} href="/components">
                Explore more effects <Arrow />
              </Link>
            </div>
            <div id="metallic-text" className={styles.metalStage}>
              <MetallicText />
            </div>
          </section>
          <section
            className={`${styles.section} ${styles.gallerySection}`}
            id="hover-gallery"
            aria-labelledby="gallery-title"
          >
            <div className={styles.galleryHeading}>
              <h2 id="gallery-title">
                {componentsBySlug["hover-gallery"].name}
              </h2>
              <p>Hover over an image to expand it.</p>
            </div>
            <HoverGallery />
            <div className={styles.galleryCaption}>
              <span>FORM Objects · Home collection</span>
              <a className={styles.textLink} href="#examples">
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
              <h2 id="focus-title">{componentsBySlug["image-focus"].name}</h2>
              <div className={styles.exampleNote}>
                <p>See every detail.</p>
                <span>A closer look at product photos and creative work.</span>
              </div>
            </div>
            <div id="image-focus" className={styles.exampleFrame}>
              <ImageFocus />
            </div>
            <p className={styles.exampleCaption}>
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
            <h2 id="how-title">How to use</h2>
            <Link className={styles.textLink} href="/components">
              Start with a component <Arrow />
            </Link>
          </div>
          <ol className={styles.steps}>
            {steps.map((step) => (
              <li key={step.number}>
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
            <div>
              <h2 id="closing-title">Explore the component library.</h2>
              <p>
                Find text animations, background effects, and interactive
                components.
              </p>
            </div>
            <Link className={styles.whiteButton} href="/components">
              Browse components <Arrow />
            </Link>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <p>Interactive components for the web.</p>
          <nav aria-label="Footer navigation">
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
        >
          TomoyoDesign
        </a>
        <div className={styles.footerBottom}>
          <span>TOMOYO DESIGN</span>
          <a href="#top">
            Back to top <Arrow up />
          </a>
        </div>
      </footer>
    </div>
  );
}
