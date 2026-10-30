import { getCollection } from "astro:content";
import { profileMarkdown } from "../lib/discovery";
import { isPublicProject, isCaseStudy, isPublicExperience, sortProjects } from "../lib/projects";

export async function GET() {
  const projects = (await getCollection("projects")).filter(isPublicProject).filter(isCaseStudy).sort(sortProjects);
  const experience = (await getCollection("experience")).filter(isPublicExperience).sort((a, b) => a.data.order - b.data.order);
  return new Response(profileMarkdown(projects, experience), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
