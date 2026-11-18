import Link from "next/link";
import type { ReactNode } from "react";
import { GitHubMark } from "./github-mark";
import styles from "./site-header.module.css";

export function GitHubLink() {
  return (
    <a
      className={styles.github}
      href="https://github.com/DaidojiTomoyo/TomoyoDesign"
      target="_blank"
      rel="noopener noreferrer"
      title="TomoyoDesign repository (opens in a new tab)"
    >
      <GitHubMark />
      GitHub
    </a>
  );
}

export function SiteHeader({
  activePage = "home",
  search,
}: {
  activePage?: "home" | "components";
  search?: ReactNode;
}) {
  return (
    <header className={styles.header} data-search={search ? true : undefined}>
      <Link
        className={styles.brand}
        href={activePage === "home" ? "/#top" : "/"}
        aria-label="TomoyoDesign home"
      >
        <strong>Tomoyo</strong>Design
      </Link>
      <nav aria-label="Main navigation" className={styles.navigation}>
        <Link
          href="/components"
          aria-current={activePage === "components" ? "page" : undefined}
        >
          Components
        </Link>
        <Link href="/#examples">Examples</Link>
        <Link href="/#how-to-use">How to use</Link>
      </nav>
      {search}
      <div className={styles.actions}>
        <GitHubLink />
        {activePage !== "components" && (
          <Link className={styles.action} href="/components">
            Browse components
          </Link>
        )}
      </div>
    </header>
  );
}
