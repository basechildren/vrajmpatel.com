import type { OrganizationMark } from "./organizationMarks";

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
  name: "Vraj Patel",
  location: "Boulder, Colorado",
  role: "Systems Integration Engineer",
  employer: {
    name: "Institute of Behavioral Science",
    parent: "University of Colorado Boulder",
    short: "CU Boulder · Institute of Behavioral Science",
  },
  education: "Dual M.S. · Computer Science + Engineering Management",
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
