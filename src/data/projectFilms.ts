export interface ProjectFilmData {
  webm: string;
  mp4: string;
  poster: string;
  width: number;
  height: number;
  caption: string;
  name: string;
  label: string;
}

const film = (slug: string, name: string, label: string): ProjectFilmData => ({
  webm: `/films/${slug}.webm`,
  mp4: `/films/${slug}.mp4`,
  poster: `/films/${slug}-poster.webp`,
  width: 1280,
  height: 800,
  caption: "Recreation · synthetic data",
  name,
  label,
});

export const projectFilms: Record<string, ProjectFilmData> = {
  "operational-ticket-intelligence": film("operational-ticket-intelligence", "ticket review", "Illustrative ticket review: an accepted suggestion remains blocked by the read-only delivery policy."),
  "building-indian-parliamentary-datasets": film("building-indian-parliamentary-datasets", "dataset recovery", "Illustrative extraction pipeline: a job resumes from its retained checkpoint without repeating completed records."),
  "full-stack-biometric-marathon": film("full-stack-biometric-marathon", "race workflow", "Illustrative race workflow: review a wireframe photo candidate, confirm a personal match, and validate a sample GPX course."),
};
