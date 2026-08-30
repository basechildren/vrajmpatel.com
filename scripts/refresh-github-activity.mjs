import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const SNAPSHOT_PATH = new URL("../src/data/githubActivitySnapshot.json", import.meta.url);

export const accounts = Object.freeze([
  Object.freeze({
    key: "personal",
    label: "Personal",
    login: "basechildren",
    url: "https://github.com/basechildren",
  }),
  Object.freeze({
    key: "academic",
    label: "Academic",
    login: "PatVraj",
    url: "https://github.com/PatVraj",
  }),
]);

export const contributionQuery = `
  query PortfolioContributionActivity($from: DateTime!, $to: DateTime!) {
    personal: user(login: "basechildren") {
      login
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              contributionLevel
              date
            }
          }
        }
      }
    }
    academic: user(login: "PatVraj") {
      login
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              contributionLevel
              date
            }
          }
        }
      }
    }
  }
`;

const contributionLevels = new Map([
  ["NONE", 0],
  ["FIRST_QUARTILE", 1],
  ["SECOND_QUARTILE", 2],
  ["THIRD_QUARTILE", 3],
  ["FOURTH_QUARTILE", 4],
]);

export function activityWindow(now = new Date()) {
  const to = new Date(now);
  to.setUTCHours(23, 59, 59, 999);

  const from = new Date(to);
  from.setUTCFullYear(from.getUTCFullYear() - 1);
  from.setUTCHours(0, 0, 0, 0);

  return { from: from.toISOString(), to: to.toISOString() };
}

function calendarFor(payload, account) {
  const user = payload?.data?.[account.key];
  const calendar = user?.contributionsCollection?.contributionCalendar;
  if (
    user?.login !== account.login ||
    !calendar ||
    !Number.isInteger(calendar.totalContributions) ||
    !Array.isArray(calendar.weeks)
  ) {
    throw new Error(`GitHub returned an invalid ${account.key} contribution calendar`);
  }
  const days = new Map();
  for (const week of calendar.weeks) {
    if (!Array.isArray(week?.contributionDays)) {
      throw new Error(`GitHub returned an invalid ${account.key} contribution week`);
    }

    for (const day of week.contributionDays) {
      const level = contributionLevels.get(day?.contributionLevel);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(day?.date ?? "") ||
        !Number.isInteger(day?.contributionCount) ||
        day.contributionCount < 0 ||
        level === undefined
      ) {
        throw new Error(`GitHub returned an invalid ${account.key} contribution day`);
      }
      days.set(day.date, { count: day.contributionCount, level });
    }
  }

  const dayTotal = [...days.values()].reduce((total, day) => total + day.count, 0);
  if (dayTotal !== calendar.totalContributions) {
    throw new Error(`GitHub returned an inconsistent ${account.key} contribution total`);
  }

  return { days, totalContributions: calendar.totalContributions };
}

export function normalizeGitHubActivity(payload, generatedAt = new Date()) {
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    throw new Error("GitHub GraphQL returned an error");
  }

  const personal = calendarFor(payload, accounts[0]);
  const academic = calendarFor(payload, accounts[1]);
  const dates = [...new Set([...personal.days.keys(), ...academic.days.keys()])].sort();

  if (dates.length < 350 || dates.length > 371) {
    throw new Error(`GitHub returned ${dates.length} calendar days; expected approximately one year`);
  }

  const days = dates.map((date) => {
    const personalDay = personal.days.get(date) ?? { count: 0, level: 0 };
    const academicDay = academic.days.get(date) ?? { count: 0, level: 0 };
    return {
      date,
      personalCount: personalDay.count,
      personalLevel: personalDay.level,
      academicCount: academicDay.count,
      academicLevel: academicDay.level,
      total: personalDay.count + academicDay.count,
    };
  });

  const accountData = accounts.map((account) => ({
    ...account,
    totalContributions:
      account.key === "personal"
        ? personal.totalContributions
        : academic.totalContributions,
  }));

  return {
    schemaVersion: 1,
    generatedAt: generatedAt.toISOString(),
    source: "github-graphql",
    range: { from: dates[0], to: dates.at(-1) },
    accounts: accountData,
    totalContributions: accountData.reduce(
      (total, account) => total + account.totalContributions,
      0,
    ),
    days,
  };
}

export function mergeWithVerifiedSnapshot(activity, verifiedSnapshot) {
  const missingAccounts = activity.accounts.filter(
    ({ totalContributions }) => totalContributions === 0,
  );
  if (missingAccounts.length === 0) return activity;
  if (missingAccounts.length === accounts.length) {
    throw new Error("GitHub returned zero contributions for every configured account");
  }
  if (!verifiedSnapshot || !Array.isArray(verifiedSnapshot.days)) {
    throw new Error("A verified GitHub activity snapshot is required for account fallback");
  }

  const verifiedDays = new Map(
    verifiedSnapshot.days.map((day) => [day.date, day]),
  );
  const fallbackKeys = new Set(missingAccounts.map(({ key }) => key));
  const days = activity.days.map((day) => {
    const verifiedDay = verifiedDays.get(day.date);
    const merged = { ...day };

    for (const key of fallbackKeys) {
      const countField = `${key}Count`;
      const levelField = `${key}Level`;
      const count = verifiedDay?.[countField] ?? 0;
      const level = verifiedDay?.[levelField] ?? 0;
      if (
        !Number.isInteger(count) ||
        count < 0 ||
        !Number.isInteger(level) ||
        level < 0 ||
        level > 4
      ) {
        throw new Error(`The verified ${key} contribution calendar is invalid`);
      }
      merged[countField] = count;
      merged[levelField] = level;
    }

    merged.total = merged.personalCount + merged.academicCount;
    return merged;
  });

  const accountData = activity.accounts.map((account) => {
    if (!fallbackKeys.has(account.key)) return account;

    const countField = `${account.key}Count`;
    const totalContributions = days.reduce(
      (total, day) => total + day[countField],
      0,
    );
    if (totalContributions === 0) {
      throw new Error(`The verified ${account.key} calendar has no activity in the current window`);
    }
    return { ...account, totalContributions };
  });

  return {
    ...activity,
    source: "github-graphql-with-verified-account-fallback",
    accounts: accountData,
    totalContributions: accountData.reduce(
      (total, account) => total + account.totalContributions,
      0,
    ),
    days,
  };
}

export async function fetchGitHubActivity({ token, now = new Date(), fetchImpl = fetch }) {
  if (!token?.trim()) {
    throw new Error("GITHUB_TOKEN is required to refresh GitHub activity");
  }

  const response = await fetchImpl(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "basechildren/vrajmpatel.com",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      query: contributionQuery,
      variables: activityWindow(now),
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed with HTTP ${response.status}`);
  }

  return normalizeGitHubActivity(await response.json(), now);
}

export async function refreshGitHubActivity({
  token = process.env.GITHUB_TOKEN,
  now = new Date(),
  fetchImpl = fetch,
  output = SNAPSHOT_PATH,
  verifiedSnapshot,
} = {}) {
  const freshActivity = await fetchGitHubActivity({ token, now, fetchImpl });
  const needsFallback = freshActivity.accounts.some(
    ({ totalContributions }) => totalContributions === 0,
  );
  const verified = needsFallback
    ? verifiedSnapshot ?? JSON.parse(await readFile(output, "utf8"))
    : undefined;
  const activity = needsFallback
    ? mergeWithVerifiedSnapshot(freshActivity, verified)
    : freshActivity;
  await writeFile(output, `${JSON.stringify(activity, null, 2)}\n`, "utf8");
  return activity;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const activity = await refreshGitHubActivity();
  console.log(
    `Synced ${activity.totalContributions} public contributions from ${activity.range.from} through ${activity.range.to}`,
  );
}
