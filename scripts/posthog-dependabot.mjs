import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { parse as parseYaml } from "yaml";

const exactSemver = /^(\d+)\.(\d+)\.(\d+)$/;
const allowedPostHogLockPackages = new Set([
  "posthog-js",
  "@posthog/browser-common",
  "@posthog/core",
  "@posthog/types",
]);
const requiredMergeChecks = new Set([
  "Quality (Node 24 LTS)",
  "Compatibility (Node 26 Current)",
  "Dependency review",
]);

export const enableAutoMergeMutation =
  "mutation EnablePostHogAutoMerge(" +
  "$pullRequestId: ID!, $expectedHeadOid: GitObjectID!) {" +
  " enablePullRequestAutoMerge(input: {" +
  " pullRequestId: $pullRequestId, mergeMethod: SQUASH," +
  " expectedHeadOid: $expectedHeadOid" +
  " }) { pullRequest { number } }" +
  "}";

function parseExactSemver(version) {
  const match = exactSemver.exec(version);
  return match ? match.slice(1).map(Number) : undefined;
}

export function isAllowedPostHogUpdate(fromVersion, toVersion) {
  const from = parseExactSemver(fromVersion);
  const to = parseExactSemver(toVersion);
  if (!from || !to || from[0] !== to[0]) return false;

  if (to[1] !== from[1]) return to[1] > from[1];
  return to[2] > from[2];
}

function isAllowedPostHogLockKey(key) {
  const packageKey = key.split("(", 1)[0];
  return [...allowedPostHogLockPackages].some(
    (name) => packageKey === name || packageKey.startsWith(name + "@"),
  );
}

function withoutAllowedPostHogPackages(section) {
  if (!section || typeof section !== "object" || Array.isArray(section)) {
    return section;
  }

  return Object.fromEntries(
    Object.entries(section).filter(([key]) => !isAllowedPostHogLockKey(key)),
  );
}

export function isAllowedPostHogLockUpdate(
  baseLock,
  headLock,
  fromVersion,
  toVersion,
) {
  if (
    !baseLock ||
    !headLock ||
    typeof baseLock !== "object" ||
    typeof headLock !== "object"
  ) {
    return false;
  }

  const base = structuredClone(baseLock);
  const head = structuredClone(headLock);
  const baseDependency = base.importers?.["."]?.dependencies?.["posthog-js"];
  const headDependency = head.importers?.["."]?.dependencies?.["posthog-js"];
  if (
    baseDependency?.specifier !== fromVersion ||
    baseDependency?.version !== fromVersion ||
    headDependency?.specifier !== toVersion ||
    headDependency?.version !== toVersion
  ) {
    return false;
  }

  head.importers["."].dependencies["posthog-js"] = baseDependency;
  for (const section of ["packages", "snapshots"]) {
    base[section] = withoutAllowedPostHogPackages(base[section]);
    head[section] = withoutAllowedPostHogPackages(head[section]);
  }

  return isDeepStrictEqual(head, base);
}

export function hasRequiredMergeRules(rules) {
  const statusRule = Array.isArray(rules)
    ? rules.find(({ type }) => type === "required_status_checks")
    : undefined;
  const contexts = new Set(
    statusRule?.parameters?.required_status_checks?.map(({ context }) => context),
  );
  return (
    statusRule?.parameters?.strict_required_status_checks_policy === true &&
    [...requiredMergeChecks].every((context) => contexts.has(context))
  );
}

export function autoMergeVariables(pullRequestId, expectedHeadOid) {
  return { pullRequestId, expectedHeadOid };
}

function skip(reason) {
  console.log("PostHog auto-merge skipped: " + reason);
}

function repositoryParts(repository) {
  const [owner, repo, extra] = repository.split("/");
  if (!owner || !repo || extra) {
    throw new Error("GITHUB_REPOSITORY must use owner/repository format");
  }
  return { owner, repo };
}

async function githubRest(repository, path, token, options = {}) {
  const response = await fetch(
    "https://api.github.com/repos/" + repository + path,
    {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + token,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    },
  );

  if (!response.ok) {
    const body = (await response.text()).slice(0, 500);
    throw new Error(
      "GitHub API " + response.status + " for " + path + ": " + body,
    );
  }

  return response.status === 204 ? undefined : response.json();
}

async function githubGraphql(query, variables, token) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error("GitHub GraphQL API returned " + response.status);
  }

  const result = await response.json();
  if (result.errors?.length) {
    throw new Error(
      "GitHub GraphQL API rejected auto-merge: " +
        result.errors.map(({ message }) => message).join("; "),
    );
  }

  return result.data;
}

async function fileAt(repository, path, sha, token) {
  const file = await githubRest(
    repository,
    "/contents/" + path + "?ref=" + encodeURIComponent(sha),
    token,
  );
  if (file.type !== "file" || typeof file.content !== "string") {
    throw new Error(path + " was not returned as a file");
  }

  return Buffer.from(file.content, "base64").toString("utf8");
}

async function packageJsonAt(repository, sha, token) {
  return JSON.parse(await fileAt(repository, "package.json", sha, token));
}

export async function main(environment = process.env) {
  const token = environment.GITHUB_TOKEN;
  const repository = environment.GITHUB_REPOSITORY;
  const eventPath = environment.GITHUB_EVENT_PATH;
  if (!token || !repository || !eventPath) {
    throw new Error(
      "GITHUB_TOKEN, GITHUB_REPOSITORY, and GITHUB_EVENT_PATH are required",
    );
  }

  const { owner, repo } = repositoryParts(repository);
  const event = JSON.parse(await readFile(eventPath, "utf8"));
  const run = event.workflow_run;
  if (
    run?.conclusion !== "success" ||
    run.event !== "pull_request" ||
    run.pull_requests?.length !== 1
  ) {
    skip("the successful workflow run is not tied to exactly one pull request");
    return;
  }

  const pullNumber = run.pull_requests[0].number;
  const pull = await githubRest(
    repository,
    "/pulls/" + pullNumber,
    token,
  );
  if (
    pull.state !== "open" ||
    pull.draft ||
    pull.user?.login !== "dependabot[bot]" ||
    pull.base?.ref !== "main" ||
    pull.head?.repo?.full_name !== owner + "/" + repo
  ) {
    skip("the pull request is not an open Dependabot change against main");
    return;
  }

  if (pull.head.sha !== run.head_sha) {
    skip("the verified commit is no longer the pull request head");
    return;
  }

  if (pull.auto_merge) {
    skip("auto-merge is already enabled");
    return;
  }

  const files = await githubRest(
    repository,
    "/pulls/" + pullNumber + "/files?per_page=100",
    token,
  );
  const names = files.map(({ filename }) => filename).sort();
  if (
    pull.changed_files !== 2 ||
    names.length !== 2 ||
    names[0] !== "package.json" ||
    names[1] !== "pnpm-lock.yaml"
  ) {
    skip("the pull request changes files outside package.json and pnpm-lock.yaml");
    return;
  }

  const basePackage = await packageJsonAt(repository, pull.base.sha, token);
  const headPackage = await packageJsonAt(repository, pull.head.sha, token);
  const fromVersion = basePackage.dependencies?.["posthog-js"];
  const toVersion = headPackage.dependencies?.["posthog-js"];
  if (
    typeof fromVersion !== "string" ||
    typeof toVersion !== "string" ||
    !isAllowedPostHogUpdate(fromVersion, toVersion)
  ) {
    skip("posthog-js is not an exact same-major upgrade");
    return;
  }

  const expectedPackage = structuredClone(headPackage);
  expectedPackage.dependencies["posthog-js"] = fromVersion;
  if (!isDeepStrictEqual(expectedPackage, basePackage)) {
    skip("package.json contains changes beyond posthog-js");
    return;
  }

  let baseLock;
  let headLock;
  try {
    baseLock = parseYaml(
      await fileAt(repository, "pnpm-lock.yaml", pull.base.sha, token),
    );
    headLock = parseYaml(
      await fileAt(repository, "pnpm-lock.yaml", pull.head.sha, token),
    );
  } catch (error) {
    throw new Error(
      "Unable to parse pnpm-lock.yaml: " +
        (error instanceof Error ? error.message : error),
    );
  }
  if (
    !isAllowedPostHogLockUpdate(
      baseLock,
      headLock,
      fromVersion,
      toVersion,
    )
  ) {
    skip("pnpm-lock.yaml contains changes outside the known PostHog package graph");
    return;
  }

  const rules = await githubRest(repository, "/rules/branches/main", token);
  if (!hasRequiredMergeRules(rules)) {
    skip("main does not require every quality, compatibility, and dependency-review check");
    return;
  }

  await githubGraphql(
    enableAutoMergeMutation,
    autoMergeVariables(pull.node_id, run.head_sha),
    token,
  );
  console.log(
    "Enabled squash auto-merge for posthog-js " +
      fromVersion +
      " -> " +
      toVersion +
      " in PR #" +
      pullNumber,
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
