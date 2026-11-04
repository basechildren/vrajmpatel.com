import { resumeVariants, type ResumeVariant } from "../../data/resumes";
import { resumeMarkdown } from "../../lib/discovery";

export function getStaticPaths() {
  return resumeVariants.map((variant) => ({ params: { variant: variant.id }, props: { variant } }));
}

export function GET({ props }: { props: { variant: ResumeVariant } }) {
  return new Response(resumeMarkdown(props.variant), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
