export interface ProofPoint {
  value: string;
  label: string;
  href?: string;
  linkLabel?: string;
}

export const proofPoints: readonly ProofPoint[] = [
  {
    value: "15 minutes to under 1",
    label: "Typical Active Directory group cleanup after PowerShell automation.",
    href: "/experience/#cu-boulder-ibs-2025",
    linkLabel: "Automation work",
  },
  {
    value: "10.8K tickets",
    label: "Reconciled in a local database snapshot on August 27, 2026.",
    href: "/projects/operational-ticket-intelligence/#current-operating-data",
    linkLabel: "Data and evidence",
  },
  {
    value: "200+ hours of audio",
    label: "40+ GB of 2014, 2019, and 2024 campaign speeches transcribed and translated with Amazon Transcribe.",
    href: "/projects/building-indian-parliamentary-datasets/#ibs-production-speech-pipeline-2024",
    linkLabel: "Pipeline work",
  },
];

export const selectedEngineering = [
  {
    title: "Model suggestions require approval",
    description: "How staff review and delivery controls govern ticket updates.",
    href: "/projects/operational-ticket-intelligence/#reliability-and-control",
  },
  {
    title: "Restarting interrupted data jobs",
    description: "Checkpoints and saved outputs keep long collection runs recoverable.",
    href: "/projects/building-indian-parliamentary-datasets/#engineering-decisions",
  },
  {
    title: "Reviewing uncertain race-photo matches",
    description: "My contribution to athlete verification and race creation in SeeMyRace.",
    href: "/projects/full-stack-biometric-marathon/#engineering-highlights",
  },
] as const;
