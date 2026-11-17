import assert from "node:assert/strict";
import test from "node:test";
import { filterComponents, readCategory } from "./catalog.ts";

test("purpose keywords find effects even when the title does not match", () => {
  assert.deepEqual(
    filterComponents("magnify", "all").map((item) => item.slug),
    ["image-focus"],
  );
  assert.deepEqual(
    filterComponents("webgl", "all").map((item) => item.slug),
    ["metallic-text", "spatial-tunnel"],
  );
});

test("search ignores case and extra whitespace and requires every term", () => {
  assert.deepEqual(
    filterComponents("  METALLIC   reflection  ", "all").map(
      (item) => item.slug,
    ),
    ["metallic-text"],
  );
  assert.equal(filterComponents("metallic galaxy", "all").length, 0);
});

test("category and keyword filters combine without erasing either condition", () => {
  assert.equal(filterComponents("metallic", "image").length, 0);
  assert.equal(filterComponents("metallic", "all").length, 1);
  assert.deepEqual(
    filterComponents("", "image").map((item) => item.slug),
    ["hover-gallery", "image-focus"],
  );
});

test("literal unusual queries fail safely and empty search restores the collection", () => {
  assert.equal(filterComponents("[.*]", "all").length, 0);
  assert.equal(filterComponents("<script>", "all").length, 0);
  assert.equal(filterComponents("   ", "all").length, 4);
});

test("invalid or missing URL categories fall back to All", () => {
  assert.equal(readCategory(null), "all");
  assert.equal(readCategory("interface"), "all");
  assert.equal(readCategory("image"), "image");
});
