const cuBoulder = {
  logo: "/logos/official/cu-boulder-black.svg",
  logoDark: "/logos/official/cu-boulder-white.svg",
  label: "University of Colorado Boulder",
} as const;

const princeton = {
  logo: "/logos/official/princeton-white.svg",
  label: "Princeton University",
  surface: "princeton",
} as const;

const purdue = {
  logo: "/logos/official/purdue-light.svg",
  logoDark: "/logos/official/purdue-dark.svg",
  label: "Purdue University",
} as const;

const l3harris = {
  logo: "/logos/official/l3harris-light.svg",
  logoDark: "/logos/official/l3harris-dark.svg",
  label: "L3Harris",
} as const;

export const organizationMarks = {
  "cu-boulder": { marks: [cuBoulder] },
  princeton: { marks: [princeton] },
  purdue: { marks: [purdue] },
  l3harris: { marks: [l3harris] },
  "purdue-l3harris": { marks: [purdue, l3harris] },
} as const;

export type OrganizationMark = keyof typeof organizationMarks;
