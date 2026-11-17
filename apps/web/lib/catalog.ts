export const componentCategories = [
  { id: "all", label: "All" },
  { id: "text", label: "Text" },
  { id: "image", label: "Image" },
  { id: "background", label: "Background" },
] as const;

export type ComponentCategory = (typeof componentCategories)[number]["id"];

export const componentsBySlug = {
  "metallic-text": {
    slug: "metallic-text",
    name: "Metallic Text",
    category: "text",
    description: "Liquid chrome with reflections you can tilt.",
    keywords: [
      "text",
      "type",
      "heading",
      "metal",
      "chrome",
      "liquid",
      "pointer",
      "reflection",
      "light",
      "shader",
      "webgl",
    ],
    poster: "/images/components/liquid-chrome-preview.jpg",
  },
  "hover-gallery": {
    slug: "hover-gallery",
    name: "Hover Gallery",
    category: "image",
    description: "Expand images as you explore the gallery.",
    keywords: ["image", "photo", "gallery", "hover", "expand", "accordion"],
    poster: "/images/components/hover-gallery.png",
  },
  "spatial-tunnel": {
    slug: "spatial-tunnel",
    name: "Spatial Tunnel",
    category: "background",
    description: "A rotating tunnel for immersive backgrounds.",
    keywords: [
      "background",
      "3d",
      "tunnel",
      "rotate",
      "shader",
      "webgl",
      "hero",
    ],
    poster: "/images/components/beveled-tunnel-preview.jpg",
  },
  "image-focus": {
    slug: "image-focus",
    name: "Image Focus",
    category: "image",
    description: "Zoom into an image to explore the details.",
    keywords: ["image", "photo", "zoom", "focus", "magnify", "detail", "hover"],
    poster: "/images/components/image-focus.png",
  },
} as const;

export type ComponentSlug = keyof typeof componentsBySlug;
export type CatalogEntry = (typeof componentsBySlug)[ComponentSlug];
export const catalogEntries = Object.values(componentsBySlug);

export function readCategory(value: string | null): ComponentCategory {
  return (
    componentCategories.find((category) => category.id === value)?.id ?? "all"
  );
}

export function filterComponents(query: string, category: ComponentCategory) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  return catalogEntries.filter((entry) => {
    if (category !== "all" && entry.category !== category) return false;
    const searchable = [entry.name, entry.description, ...entry.keywords]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}
