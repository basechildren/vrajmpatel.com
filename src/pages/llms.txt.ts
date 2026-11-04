import { getCollection } from "astro:content";
import { llmsIndex } from "../lib/discovery";
import { isPublicProject, isCaseStudy, sortProjects } from "../lib/projects";

export async function GET() {
  const projects = (await getCollection("projects")).filter(isPublicProject).filter(isCaseStudy).sort(sortProjects);
  return new Response(llmsIndex(projects), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
