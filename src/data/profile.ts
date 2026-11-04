import type { OrganizationMark } from "./organizationMarks";
import resumeContent from "./resumeContent.json";

interface Affiliation {
  discipline: "Engineering" | "Research";
  organization: string;
  mark: OrganizationMark;
}

interface GitHubProfile {
  label: "Personal GitHub" | "Academic GitHub";
  username: string;
  href: `https://github.com/${string}`;
}

export const profile = {
  name: resumeContent.person.name,
  location: resumeContent.person.location,
  role: resumeContent.person.role,
  description: resumeContent.person.description,
  site: resumeContent.person.site,
  linkedin: resumeContent.person.linkedin,
  employer: {
    name: "Institute of Behavioral Science",
    parent: "University of Colorado Boulder",
    short: "CU Boulder · Institute of Behavioral Science",
  },
  education: resumeContent.person.education,
  githubProfiles: [
    {
      label: "Personal GitHub",
      username: "basechildren",
      href: "https://github.com/basechildren",
    },
    {
      label: "Academic GitHub",
      username: "PatVraj",
      href: "https://github.com/PatVraj",
    },
  ] satisfies readonly GitHubProfile[],
  affiliations: [
    {
      discipline: "Engineering",
      organization: "CU Boulder",
      mark: "cu-boulder",
    },
    {
      discipline: "Research",
      organization: "Studio Lab · CU Boulder",
      mark: "cu-boulder",
    },
    {
      discipline: "Research",
      organization: "Princeton University",
      mark: "princeton",
    },
    {
      discipline: "Research",
      organization: "The Data Mine · Purdue University",
      mark: "purdue",
    },
    {
      discipline: "Research",
      organization: "L3Harris collaboration",
      mark: "l3harris",
    },
  ] satisfies readonly Affiliation[],
} as const;
