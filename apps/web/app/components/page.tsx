import type { Metadata } from "next";
import { Suspense } from "react";
import {
  ComponentCatalog,
  CatalogLoading,
} from "@/components/catalog/component-catalog";

export const metadata: Metadata = {
  title: "Components — TomoyoDesign",
  description:
    "Explore interactive text, image, and background effects. Search the collection and try a live preview.",
};

export default function ComponentsPage() {
  return (
    <Suspense fallback={<CatalogLoading />}>
      <ComponentCatalog />
    </Suspense>
  );
}
