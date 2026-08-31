export interface ProofPoint {
  value: string;
  label: string;
}

export const proofPoints = [
  {
    value: "82.6% / 0.756",
    label: "Sealed-test accuracy / macro-F1 for an unreleased BERT routing candidate",
  },
  {
    value: "10.8K / 96.7%",
    label: "Current ticket corpus / records carrying support-group IDs",
  },
  {
    value: "61% / 66% smaller",
    label: "Raw / gzip analytics payload after replacing Plotly with Recharts",
  },
  {
    value: "~15 min → <1 min",
    label: "Typical Active Directory group cleanup after PowerShell automation",
  },
] satisfies readonly ProofPoint[];

export const capabilities = [
  {
    title: "Backend systems and controlled integrations",
    summary:
      "My ticket-intelligence work connects source reconciliation, application state, staff review, and approved outbound updates. Model predictions remain separate from authorization.",
    evidence: "FastAPI · PostgreSQL · React · Human-in-the-loop ML",
    href: "/projects/operational-ticket-intelligence",
    linkLabel: "See the ticket-intelligence case study",
  },
  {
    title: "Automation with measured results",
    summary:
      "I turn repetitive administrative work into bounded tools with clear outcomes, including an Active Directory offboarding workflow that reduced a typical 15-minute cleanup to under one minute.",
    evidence: "PowerShell · Active Directory · Endpoint operations",
    href: "/experience",
    linkLabel: "See the experience behind the result",
  },
  {
    title: "Recoverable data and ML pipelines",
    summary:
      "I design long-running collection and processing jobs around checkpoints, resumability, and reviewable outputs—from public records to audio and satellite telemetry.",
    evidence: "Python · AWS · Selenium · Document processing",
    href: "/projects/building-indian-parliamentary-datasets",
    linkLabel: "See the parliamentary-data case study",
  },
] as const;
