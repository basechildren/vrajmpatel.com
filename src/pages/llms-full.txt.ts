import { getCollection } from "astro:content";
import { profileMarkdown, projectMarkdown } from "../lib/discovery";
import { isPublicProject, isCaseStudy, isPublicExperience, sortProjects } from "../lib/projects";

export async function GET() {
  const projects = (await getCollection("projects")).filter(isPublicProject).filter(isCaseStudy).sort(sortProjects);
  const experience = (await getCollection("experience")).filter(isPublicExperience).sort((a, b) => a.data.order - b.data.order);
  const body = [profileMarkdown(projects, experience), ...projects.map(projectMarkdown)].join("\n---\n\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
