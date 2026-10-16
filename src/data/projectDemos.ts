interface DemoStep {
  title: string;
  description: string;
  fields: readonly { label: string; value: string }[];
  action?: { label: string; result: string; updates: Record<string, string> };
}
interface ProjectDemo {
  title: string;
  description: string;
  steps: readonly DemoStep[];
}

// Editorial examples, deliberately separate from application data and model output.
export const projectDemos: Record<string, ProjectDemo> = {
  "operational-ticket-intelligence": {
    title: "Follow a ticket through review",
    description: "No tickets are fetched or updated; the suggested group is illustrative.",
    steps: [
      { title: "Reconcile", description: "Start with a consistent source record so the application can distinguish intake from later changes.", fields: [
        { label: "Example record", value: "DEMO-104" }, { label: "Request", value: "Set up a replacement laptop" }, { label: "Source state", value: "Open · imported for review" },
      ] },
      { title: "Suggest", description: "A routing suggestion is evidence for the operator. It does not grant permission to update the source system.", fields: [
        { label: "Illustrative destination", value: "Endpoint support" }, { label: "Evidence type", value: "Model suggestion · not a verified label" }, { label: "External update", value: "Not authorized" },
      ] },
      { title: "Review", description: "The operator can accept a suggestion. That review decision remains distinct from permission to send an external update.", fields: [
        { label: "Operator decision", value: "Awaiting review" }, { label: "Runtime policy", value: "Read-only" },
      ], action: { label: "Accept example suggestion", updates: { "Operator decision": "Accepted in this example" }, result: "Example accepted for review. External delivery remains blocked by the read-only policy; no external update was sent." } },
      { title: "Apply controls", description: "Even an accepted label must pass runtime and lifecycle controls before any external change is possible.", fields: [
        { label: "Approval alone", value: "Insufficient for delivery" }, { label: "Hosted policy described here", value: "Read-only · automatic delivery disabled · daily write cap 0" }, { label: "Result in this example", value: "External update blocked" },
      ] },
    ],
  },
  "building-indian-parliamentary-datasets": {
    title: "From source text to a recoverable record",
    description: "An invented document and simplified checkpoint illustrate the pipeline. These are not research records or measured processing results.",
    steps: [
      { title: "Capture", description: "Retain the source reference alongside extracted text so a transformation can be traced back to its input.", fields: [
        { label: "Source document", value: "statement-demo-003.pdf · page 2" }, { label: "Extracted ministry", value: "Min. of Example Affairs" }, { label: "Extracted statement", value: "The committee reviewed the proposed programme." },
      ] },
      { title: "Normalize", description: "Map a candidate name into a consistent representation while keeping the original text available for review.", fields: [
        { label: "Raw ministry", value: "Min. of Example Affairs" }, { label: "Candidate normalized name", value: "Ministry of Example Affairs" }, { label: "Review status", value: "Needs verification" }, { label: "Provenance", value: "statement-demo-003.pdf · page 2" },
      ] },
      { title: "Interrupt", description: "An interrupted job should not discard already completed records or advance its checkpoint past unfinished work.", fields: [
        { label: "Completed records", value: "demo-001, demo-002" }, { label: "Pending record", value: "demo-003" }, { label: "Retained artifacts", value: "Source text and completed normalized records" },
      ] },
      { title: "Resume", description: "Resume from the retained boundary. In this simplified example, the first two records are reused and the third is processed.", fields: [
        { label: "Restart point", value: "demo-003" }, { label: "Work retained", value: "demo-001 and demo-002" }, { label: "Recovery state", value: "Waiting to resume" },
      ], action: { label: "Resume the example", updates: { "Recovery state": "Complete in this example" }, result: "Illustrated recovery complete: demo-001 and demo-002 were retained; demo-003 was processed. Its candidate ministry name still needs review." } },
    ],
  },
  "full-stack-biometric-marathon": {
    title: "Find a candidate. Keep the athlete in control.",
    description: "A text-only reconstruction using invented race and photo records. No photos, biometric examples, or private application screens are used.",
    steps: [
      { title: "Choose a race", description: "Race context narrows the search before the bib or face retrieval branches generate candidates.", fields: [
        { label: "Example race", value: "Sample City 10K" }, { label: "Search input", value: "Bib 204" }, { label: "Search scope", value: "Photos from this race only" },
      ] },
      { title: "Inspect candidates", description: "A matching signal produces a candidate, not a guarantee. These invented records illustrate that distinction without showing athlete images.", fields: [
        { label: "Candidate record", value: "photo-demo-017" }, { label: "Illustrative signal", value: "Bib text matches 204" }, { label: "Review state", value: "Unreviewed" },
      ] },
      { title: "Confirm a match", description: "My verification workflow records a decision for the signed-in athlete. Confirming a candidate does not establish system-wide accuracy.", fields: [
        { label: "Candidate record", value: "photo-demo-017" }, { label: "Review owner", value: "Example athlete A" }, { label: "Review state", value: "Unreviewed" },
      ], action: { label: "Confirm the example match", updates: { "Review state": "Confirmed for example athlete A" }, result: "Illustrated review saved: photo-demo-017 is confirmed for example athlete A. Another athlete’s review remains independent. Nothing was sent to SeeMyRace." } },
      { title: "Create a race", description: "My GPX work connects race creation with file validation and persisted course metadata.", fields: [
        { label: "Example course file", value: "sample-course.gpx" }, { label: "Upload boundary", value: "Extension allowlist and sanitized filename" }, { label: "Stored context", value: "Course metadata associated with the race" },
      ] },
    ],
  },
};
