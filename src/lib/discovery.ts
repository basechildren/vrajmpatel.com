import type { CollectionEntry } from "astro:content";
import { profile } from "../data/profile";
import content from "../data/resumeContent.json";
import { resumeVariants, type ResumeVariant } from "../data/resumes";

const url = (path: string) => new URL(path, profile.site).href;
const link = (name: string, path: string, note: string) => `- [${name}](${url(path)}): ${note}`;
const selectedBullets = (bullets: Record<string, string | undefined>, keys: string[]) => keys.map((key) => {
  const text = bullets[key];
  if (!text) throw new Error(`Missing resume bullet: ${key}`);
  return `- ${text}`;
});
const plainMarkdown = (body: string) => body
  .replace(/<h2\b[^>]*>(.*?)<\/h2>/g, "## $1")
  .replace(/<summary>(.*?)<\/summary>/g, "### $1")
  .replace(/<\/?details>/g, "")
  .trim();

export function projectMarkdown(entry: CollectionEntry<"projects">) {
  const { data, id } = entry;
  return [
    `# ${data.title}`, "", `> ${data.summary ?? ""}`, "",
    `Canonical page: ${url(`/projects/${id}/`)}`, "",
    `Domain: ${data.domain}`, `Setting: ${data.setting ?? ""}`, `Status: ${data.status ?? ""}`, "",
    "## Personal contribution", "", data.contribution ?? "", "",
    "## Evidence and scope", "",
    ...(data.proof ?? []).map((proof) => `- **${proof.value}**: ${proof.label}`), "",
    "## Engineering overview", "", data.overview?.problem ?? "", "", data.overview?.built ?? "", "",
    ...(data.systemPath ?? []).flatMap((step) => [`### ${step.title}`, "", step.purpose, "", step.technical, ""]),
    plainMarkdown(entry.body ?? ""), "",
    "## Technologies", "", (data.tech ?? []).join(", "), "",
  ].join("\n");
}

export function profileMarkdown(projects: CollectionEntry<"projects">[], experience: CollectionEntry<"experience">[]) {
  return [
    `# ${profile.name}`, "", `> ${profile.description}`, "",
    `Professional focus: ${profile.role}`, `Location: ${profile.location}`, "",
    "## Education", "",
    ...content.education.map((item) => `- **${item.degree}** (${item.date}). ${item.detail}.`), "",
    "## Experience", "",
    ...experience.flatMap((entry) => [
      `### ${entry.id === "cu-boulder-ibs-2025" ? profile.role : entry.data.title}`, "",
      `${entry.data.organization} | ${entry.data.period}`, "",
      plainMarkdown(entry.body ?? ""), "",
    ]),
    "## Selected engineering work", "",
    ...projects.flatMap((entry) => [
      `### ${entry.data.title}`, "", entry.data.contribution ?? "", "",
      link("Case study", `/projects/${entry.id}/`, entry.data.summary ?? ""),
      link("Detailed Markdown", `/projects/${entry.id}.md`, "Contribution, results, limitations, and architecture."), "",
    ]),
    "## Resumes", "",
    ...resumeVariants.map((variant) => link(variant.label, variant.markdown, `${variant.pages} page${variant.pages === 1 ? "" : "s"}; ${variant.headline}. PDF: ${url(variant.pdf)}`)), "",
    "## Professional links", "",
    `- [LinkedIn](${profile.linkedin})`,
    ...profile.githubProfiles.map((item) => `- [${item.label}](${item.href})`),
    "",
  ].join("\n");
}

export function llmsIndex(projects: CollectionEntry<"projects">[]) {
  return [
    `# ${profile.name}`, "", `> ${profile.description}`, "",
    `${profile.name} is based in ${profile.location}. His current professional focus is ${profile.role}.`,
    `${profile.education} at CU Boulder, expected May 2028. B.S. Computer Science with a Business minor, May 2025.`, "",
    "Work includes backend services, source reconciliation, operational analytics, restartable research pipelines, and human-reviewed ML workflows. Model results are scoped to their stated evaluation datasets; synthetic demonstrations are labeled on the site.", "",
    "## Profile and experience", "",
    link("Professional profile", "/profile.md", "Education, separate appointments, contributions, and public evidence."),
    link("Recruiter brief", "/brief/", "Concise role fit and selected engineering contributions."),
    link("Experience", "/experience/", "Employment and research history with appointment boundaries."), "",
    "## Selected case studies", "",
    ...projects.map((entry) => link(entry.data.title, `/projects/${entry.id}.md`, `${entry.data.summary ?? ""} ${entry.data.contribution ?? ""}`)), "",
    "## Resumes", "",
    ...resumeVariants.map((variant) => link(variant.label, variant.markdown, `${variant.headline}. PDF: ${url(variant.pdf)}`)), "",
    "## Optional", "",
    link("Full portfolio text", "/llms-full.txt", "Public profile and detailed case studies in one document."),
    link("Resume downloads", "/resume/", "Choose a software, data, ML, or comprehensive master resume."),
    ...profile.githubProfiles.map((item) => `- [${item.label}](${item.href}): Public repositories and contribution history.`),
    `- [LinkedIn](${profile.linkedin}): Professional contact.`, "",
  ].join("\n");
}

export function resumeMarkdown(variant: ResumeVariant) {
  const experience = new Map(content.experience.map((entry) => [entry.id, entry]));
  const projects = new Map(content.projects.map((entry) => [entry.id, entry]));
  return [
    `# ${profile.name} — ${variant.label}`, "", `> ${variant.headline}`, "", variant.summary, "",
    `Location: ${profile.location}`, `Updated: ${content.updated}`, "",
    link("Download PDF", variant.pdf, `${variant.pages} page${variant.pages === 1 ? "" : "s"}.`), "",
    "## Experience", "",
    ...variant.experience.flatMap((selection) => {
      const entry = experience.get(selection.id)!;
      return [`### ${entry.title}`, "", `${entry.organization} | ${entry.period}`, "", ...selectedBullets(entry.bullets, selection.bullets), ""];
    }),
    "## Selected projects", "",
    ...variant.projects.flatMap((selection) => {
      const entry = projects.get(selection.id)!;
      return [`### ${entry.title}`, "", entry.tech, "", ...selectedBullets(entry.bullets, selection.bullets), ""];
    }),
    "## Education", "",
    ...content.education.map((item) => `- **${item.degree}** (${item.date}). ${item.detail}.`), "",
    "## Skills", "",
    ...variant.skillGroups.map((group) => `- **${group}**: ${content.skills[group as keyof typeof content.skills]}`), "",
    "## Links", "", `- [Portfolio](${profile.site})`, `- [LinkedIn](${profile.linkedin})`,
    ...profile.githubProfiles.map((item) => `- [${item.label}](${item.href})`), "",
  ].join("\n");
}
