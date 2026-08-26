import type { CollectionEntry } from "astro:content";

export const isPublicProject = (entry: CollectionEntry<"projects">) =>
  entry.data.visibility === "public";

export const isCaseStudy = (entry: CollectionEntry<"projects">) =>
  entry.data.presentation === "case-study";

export const sortProjects = (
  left: CollectionEntry<"projects">,
  right: CollectionEntry<"projects">,
) => {
  const featuredOrder =
    Number(Boolean(right.data.featured)) - Number(Boolean(left.data.featured));
  return featuredOrder || (left.data.order ?? 99) - (right.data.order ?? 99);
};
