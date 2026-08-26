import assert from "node:assert/strict";
import test from "node:test";

import {
  autoMergeVariables,
  enableAutoMergeMutation,
  hasRequiredMergeRules,
  isAllowedPostHogLockUpdate,
  isAllowedPostHogUpdate,
} from "./posthog-dependabot.mjs";

test("allows exact PostHog patch and minor upgrades", () => {
  assert.equal(isAllowedPostHogUpdate("1.419.0", "1.419.1"), true);
  assert.equal(isAllowedPostHogUpdate("1.419.1", "1.420.0"), true);
});

test("rejects major, prerelease, duplicate, and downgrade updates", () => {
  assert.equal(isAllowedPostHogUpdate("1.419.0", "2.0.0"), false);
  assert.equal(isAllowedPostHogUpdate("1.419.0", "1.420.0-beta.1"), false);
  assert.equal(isAllowedPostHogUpdate("1.419.0", "1.419.0"), false);
  assert.equal(isAllowedPostHogUpdate("1.419.1", "1.419.0"), false);
});

test("rejects ranges and malformed versions", () => {
  assert.equal(isAllowedPostHogUpdate("^1.419.0", "1.420.0"), false);
  assert.equal(isAllowedPostHogUpdate("1.419.0", "latest"), false);
  assert.equal(isAllowedPostHogUpdate("", "1.420.0"), false);
});

function lockfile(version: string) {
  return {
    lockfileVersion: "9.0",
    settings: {
      autoInstallPeers: true,
      excludeLinksFromLockfile: false,
    },
    importers: {
      ".": {
        dependencies: {
          astro: {
            specifier: "^7.2.7",
            version: "7.2.7",
          },
          "posthog-js": {
            specifier: version,
            version,
          },
        },
      },
    },
    packages: {
      "astro@7.2.7": {
        resolution: { integrity: "sha512-astro" },
      },
      "@posthog/core@1.48.11": {
        resolution: { integrity: "sha512-posthog-core" },
      },
      [`posthog-js@${version}`]: {
        resolution: { integrity: `sha512-${version}` },
      },
    },
    snapshots: {
      "astro@7.2.7": {},
      "@posthog/core@1.48.11": {},
      [`posthog-js@${version}`]: {
        dependencies: { "@posthog/core": "1.48.11" },
      },
    },
  };
}

test("allows lockfile changes limited to the known PostHog graph", () => {
  assert.equal(
    isAllowedPostHogLockUpdate(
      lockfile("1.419.0"),
      lockfile("1.419.2"),
      "1.419.0",
      "1.419.2",
    ),
    true,
  );
});

test("rejects unrelated and unexpected lockfile changes", () => {
  const unrelated = lockfile("1.419.2");
  unrelated.packages["astro@7.2.7"].resolution.integrity = "sha512-changed";
  assert.equal(
    isAllowedPostHogLockUpdate(
      lockfile("1.419.0"),
      unrelated,
      "1.419.0",
      "1.419.2",
    ),
    false,
  );

  const unexpected = lockfile("1.419.2");
  unexpected.packages["@posthog/unexpected@1.0.0"] = {
    resolution: { integrity: "sha512-unexpected" },
  };
  assert.equal(
    isAllowedPostHogLockUpdate(
      lockfile("1.419.0"),
      unexpected,
      "1.419.0",
      "1.419.2",
    ),
    false,
  );
});

test("requires all merge checks before enabling auto-merge", () => {
  const rule = {
    type: "required_status_checks",
    parameters: {
      required_status_checks: [
        { context: "Quality (Node 24 LTS)" },
        { context: "Compatibility (Node 26 Current)" },
        { context: "Dependency review" },
      ],
    },
  };
  assert.equal(hasRequiredMergeRules([rule]), true);
  rule.parameters.required_status_checks.pop();
  assert.equal(hasRequiredMergeRules([rule]), false);
});

test("binds the auto-merge mutation to the verified head", () => {
  assert.match(enableAutoMergeMutation, /expectedHeadOid/);
  assert.deepEqual(autoMergeVariables("PR_node_id", "abc123"), {
    pullRequestId: "PR_node_id",
    expectedHeadOid: "abc123",
  });
});
