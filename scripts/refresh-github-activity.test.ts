import assert from "node:assert/strict";
import test from "node:test";

import {
  accounts,
  activityWindow,
  contributionQuery,
  fetchGitHubActivity,
  normalizeGitHubActivity,
} from "./refresh-github-activity.mjs";

const now = new Date("2026-08-27T12:00:00.000Z");

function calendar(login: string, activeDate: string, count: number, level: string) {
  const days: Array<{
    contributionCount: number;
    contributionLevel: string;
    date: string;
  }> = [];
  const start = new Date("2025-08-24T00:00:00.000Z");
  for (let index = 0; index < 369; index += 1) {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    const dateString = date.toISOString().slice(0, 10);
    days.push({
      contributionCount: dateString === activeDate ? count : 0,
      contributionLevel: dateString === activeDate ? level : "NONE",
      date: dateString,
    });
  }

  return {
    login,
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: count,
        weeks: Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => ({
          contributionDays: days.slice(index * 7, index * 7 + 7),
        })),
      },
    },
  };
}

function githubPayload() {
  return {
    data: {
      personal: calendar("basechildren", "2026-08-26", 2, "SECOND_QUARTILE"),
      academic: calendar("PatVraj", "2026-08-26", 4, "FOURTH_QUARTILE"),
    },
  };
}

test("uses only the fixed personal and academic GitHub accounts", () => {
  assert.deepEqual(
    accounts.map(({ key, login }) => ({ key, login })),
    [
      { key: "personal", login: "basechildren" },
      { key: "academic", login: "PatVraj" },
    ],
  );
  assert.doesNotMatch(JSON.stringify(accounts), /IBS-Vraj/);
  assert.match(contributionQuery, /personal: user\(login: "basechildren"\)/);
  assert.match(contributionQuery, /academic: user\(login: "PatVraj"\)/);
});

test("normalizes and overlays the two GitHub calendars", () => {
  const result = normalizeGitHubActivity(githubPayload(), now);
  const overlap = result.days.find(({ date }) => date === "2026-08-26");

  assert.equal(result.source, "github-graphql");
  assert.equal(result.days.length, 369);
  assert.equal(result.totalContributions, 6);
  assert.deepEqual(overlap, {
    date: "2026-08-26",
    personalCount: 2,
    personalLevel: 2,
    academicCount: 4,
    academicLevel: 4,
    total: 6,
  });
});

test("requests one year from GitHub without exposing the token", async () => {
  let request: { input?: string; init?: RequestInit } = {};
  const result = await fetchGitHubActivity({
    token: "test-token",
    now,
    async fetchImpl(input, init) {
      request = { input: String(input), init };
      return Response.json(githubPayload());
    },
  });

  assert.equal(request.input, "https://api.github.com/graphql");
  assert.equal(request.init?.method, "POST");
  assert.equal(
    new Headers(request.init?.headers).get("authorization"),
    "Bearer test-token",
  );
  assert.deepEqual(JSON.parse(String(request.init?.body)).variables, activityWindow(now));
  assert.doesNotMatch(JSON.stringify(result), /test-token/);
});

test("fails closed on missing credentials and malformed calendars", async () => {
  await assert.rejects(
    fetchGitHubActivity({ token: "", now, fetchImpl: fetch }),
    /GITHUB_TOKEN is required/,
  );

  assert.throws(
    () => normalizeGitHubActivity({ data: {} }, now),
    /invalid personal contribution calendar/,
  );
});
