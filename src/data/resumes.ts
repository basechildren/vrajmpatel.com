import content from "./resumeContent.json";

export const resumeVariants = content.variants.map((variant) => ({
  ...variant,
  pdf: `/resumes/${variant.id}.pdf`,
  markdown: `/resumes/${variant.id}.md`,
}));

export type ResumeVariant = (typeof resumeVariants)[number];
