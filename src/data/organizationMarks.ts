export const organizationMarks = {
  "cu-boulder": {
    marks: [
      {
        logo: "/logos/cu-standalone.png.avif",
        aspect: "square",
      },
    ],
  },
  "purdue-l3harris": {
    marks: [
      {
        logo: "/logos/purdue-datamine-dark.png",
        aspect: "wide",
        scale: 1.35,
      },
      {
        logo: "/logos/l3harris-light.png",
        aspect: "wide",
        scale: 1.45,
      },
    ],
  },
} as const;

export type OrganizationMark = keyof typeof organizationMarks;
