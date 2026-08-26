import type { OrganizationMark } from "./organizationMarks";

interface Affiliation {
  discipline: "Engineering" | "Research";
  organization: string;
  mark: OrganizationMark;
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
  affiliations: [
    {
      discipline: "Engineering",
      organization: "CU Boulder",
      mark: "cu-boulder",
    },
    {
      discipline: "Research",
      organization: "Princeton · Studio Lab",
      mark: "princeton",
    },
    {
      discipline: "Research",
      organization: "Purdue University",
      mark: "purdue",
    },
    {
      discipline: "Research",
      organization: "L3Harris",
      mark: "l3harris",
    },
  ] satisfies readonly Affiliation[],
} as const;
