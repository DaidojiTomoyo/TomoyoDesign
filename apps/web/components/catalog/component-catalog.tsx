"use client";

import { Pause, Play, Search, SearchX, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SiteHeader } from "@/components/home/site-header";
import {
  catalogEntries,
  componentCategories,
  filterComponents,
  readCategory,
  type CatalogEntry,
  type ComponentCategory,
  type ComponentSlug,
} from "@/lib/catalog";
import { CatalogPreview } from "./catalog-preview";
import styles from "./component-catalog.module.css";

function subscribeMotion(callback: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", callback);
  document.addEventListener("visibilitychange", callback);
  return () => {
    preference.removeEventListener("change", callback);
    document.removeEventListener("visibilitychange", callback);
  };
}

function canAnimate() {
  return (
    !document.hidden &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function serverMotion() {
  return false;
}

type CardProps = {
  entry: CatalogEntry;
  active: boolean;
  motionAllowed: boolean;
  onHover: (slug: ComponentSlug | null) => void;
  onFocus: (slug: ComponentSlug | null) => void;
};

function ComponentCard({
  entry,
  active,
  motionAllowed,
  onHover,
  onFocus,
}: CardProps) {
  const cardRef = useRef<HTMLLIElement>(null);
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const pointerIntent = useRef<boolean | null>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const running = active && visible && motionAllowed && !paused;
  const category = componentCategories.find(
    (item) => item.id === entry.category,
  )?.label;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(
      ([item]) => setVisible(item.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <li
      ref={cardRef}
      className={styles.card}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" || event.pointerType === "pen") {
          onHover(entry.slug);
        }
      }}
      onPointerLeave={() => onHover(null)}
      onPointerDownCapture={() => onFocus(null)}
      onFocusCapture={(event) => {
        if (event.target.matches(":focus-visible")) {
          onFocus(entry.slug);
        }
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onFocus(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setPaused(true);
          event.stopPropagation();
        }
      }}
    >
      <div className={styles.preview}>
        <CatalogPreview
          slug={entry.slug}
          active={running}
          onRetryFocus={() => previewButtonRef.current?.focus()}
        />
      </div>
      <div className={styles.cardHeading}>
        <h2>{entry.name}</h2>
        <span className={styles.category}>{category}</span>
      </div>
      <p className={styles.description}>{entry.description}</p>
      <button
        ref={previewButtonRef}
        type="button"
        className={styles.previewAction}
        aria-label={`${running ? "Pause" : "Preview"} ${entry.name}`}
        aria-pressed={running}
        disabled={!motionAllowed}
        title={
          !motionAllowed
            ? "Motion is paused by your browser preference or while this page is hidden"
            : undefined
        }
        onPointerDown={() => {
          pointerIntent.current = running;
        }}
        onPointerCancel={() => {
          pointerIntent.current = null;
        }}
        onClick={(event) => {
          // A pointer-focused button can later be activated from the keyboard.
          if (event.detail === 0) onFocus(entry.slug);
          setPaused(
            event.detail === 0 ? running : (pointerIntent.current ?? running),
          );
          pointerIntent.current = null;
        }}
      >
        {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        {running ? "Pause preview" : "Preview"}
      </button>
    </li>
  );
}

export function ComponentCatalog() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [previousUrlQuery, setPreviousUrlQuery] = useState(urlQuery);
  // Keep typing immediate while also accepting same-route Link navigation.
  if (urlQuery !== previousUrlQuery) {
    setPreviousUrlQuery(urlQuery);
    setQuery(urlQuery);
  }
  const category = readCategory(searchParams.get("category"));
  const entries = filterComponents(query, category);
  const searchRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState<ComponentSlug | null>(null);
  const [focused, setFocused] = useState<ComponentSlug | null>(null);
  const motionAllowed = useSyncExternalStore(
    subscribeMotion,
    canAnimate,
    serverMotion,
  );
  const selected = entries.some((entry) => entry.slug === focused)
    ? focused
    : hovered;
  const hasQuery = query.trim().length > 0;
  const hasCategory = category !== "all";

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    document.addEventListener("keydown", focusSearch);
    const restoreSearch = () => {
      setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
      setHovered(null);
      setFocused(null);
    };
    window.addEventListener("popstate", restoreSearch);
    return () => {
      document.removeEventListener("keydown", focusSearch);
      window.removeEventListener("popstate", restoreSearch);
    };
  }, []);

  function updateSearch(
    nextQuery: string,
    nextCategory: ComponentCategory,
    push = false,
  ) {
    setQuery(nextQuery);
    const params = new URLSearchParams(window.location.search);
    if (nextQuery) params.set("q", nextQuery);
    else params.delete("q");
    if (nextCategory !== "all") params.set("category", nextCategory);
    else params.delete("category");
    const suffix = params.toString();
    const url = `${window.location.pathname}${suffix ? `?${suffix}` : ""}`;
    if (push) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
    setHovered(null);
    setFocused(null);
  }

  const search = (
    <form
      role="search"
      className={styles.search}
      onSubmit={(event) => event.preventDefault()}
    >
      <Search aria-hidden="true" className={styles.searchIcon} />
      <label htmlFor="component-search" className="sr-only">
        Search components
      </label>
      <input
        ref={searchRef}
        id="component-search"
        type="search"
        placeholder="Search components…"
        value={query}
        maxLength={200}
        autoComplete="off"
        spellCheck={false}
        aria-controls="component-results"
        onChange={(event) => updateSearch(event.target.value, category)}
      />
      {query ? (
        <button
          type="button"
          className={styles.clearSearch}
          aria-label="Clear search"
          onClick={() => {
            updateSearch("", category);
            searchRef.current?.focus();
          }}
        >
          <X aria-hidden="true" />
        </button>
      ) : (
        <span className={styles.shortcut} aria-hidden="true">
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </span>
      )}
    </form>
  );

  return (
    <CatalogLayout search={search}>
      <div className={styles.toolbar}>
        <div
          className={styles.categories}
          role="group"
          aria-label="Component category"
        >
          {componentCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => updateSearch(query, item.id, item.id !== category)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p
          className={styles.resultCount}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {entries.length} {entries.length === 1 ? "component" : "components"}
        </p>
      </div>
      <div id="component-results">
        {entries.length ? (
          <ul className={styles.grid}>
            {entries.map((entry) => (
              <ComponentCard
                key={entry.slug}
                entry={entry}
                active={selected === entry.slug}
                motionAllowed={motionAllowed}
                onHover={setHovered}
                onFocus={setFocused}
              />
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <SearchX aria-hidden="true" />
            <h2>No components found</h2>
            <p>
              {hasQuery ? (
                <>
                  No matches for <strong>“{query}”</strong>
                  {hasCategory
                    ? ` in ${componentCategories.find((item) => item.id === category)?.label}`
                    : ""}
                  . Try another keyword
                  {hasCategory ? " or clear the category" : ""}.
                </>
              ) : (
                "There are no components in this category yet."
              )}
            </p>
            <div className={styles.emptyActions}>
              {hasCategory && (
                <button
                  type="button"
                  onClick={() => updateSearch(query, "all", true)}
                >
                  Clear category
                </button>
              )}
              {hasQuery && (
                <button
                  type="button"
                  onClick={() => {
                    updateSearch("", category);
                    searchRef.current?.focus();
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {entries.length > 0 && (
        <p className={styles.endNote}>
          {!hasQuery && !hasCategory
            ? `Showing all ${catalogEntries.length} components`
            : `Showing ${entries.length} of ${catalogEntries.length} components`}
        </p>
      )}
    </CatalogLayout>
  );
}

function CatalogLayout({
  search,
  children,
}: {
  search: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className={styles.header}>
        <SiteHeader activePage="components" search={search} />
      </div>
      <main id="main" className={styles.main} tabIndex={-1}>
        <div className={styles.introduction}>
          <h1>Components</h1>
          <p>Explore effects for text, images, and backgrounds.</p>
        </div>
        {children}
      </main>
    </>
  );
}

export function CatalogLoading() {
  return (
    <CatalogLayout
      search={
        <div className={styles.search} aria-hidden="true">
          <Search className={styles.searchIcon} />
          <span className={styles.searchPlaceholder}>Search components…</span>
        </div>
      }
    >
      <div className={styles.loading} role="status">
        Loading components…
      </div>
    </CatalogLayout>
  );
}
