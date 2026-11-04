import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { projectMarkdown } from "../../lib/discovery";
import { isPublicProject, isCaseStudy } from "../../lib/projects";

export async function getStaticPaths() {
  return (await getCollection("projects")).filter(isPublicProject).filter(isCaseStudy)
    .map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export function GET({ props }: { props: { entry: CollectionEntry<"projects"> } }) {
  return new Response(projectMarkdown(props.entry), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
