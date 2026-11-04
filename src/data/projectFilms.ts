import type { ImageMetadata } from "astro";
import productionPoster from "../assets/seemyrace-production-site-poster.webp";

interface ProjectMediaBase {
  width: number;
  height: number;
  caption: string;
  name: string;
  label: string;
}
export type ProjectFilmData = ProjectMediaBase & ({ poster: string; webm: string; mp4: string; href?: never } | { poster: ImageMetadata; href: string; webm?: never; mp4?: never });

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
  "full-stack-biometric-marathon": {
    href: "https://seemyrace.ecolocate.org/",
    poster: productionPoster,
    width: 1440,
    height: 900,
    caption: "Production site",
    name: "SeeMyRace",
    label: "SeeMyRace production homepage. Visit the live product (opens in a new tab).",
  },
};
