import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  accountFor,
  activitySource,
  formattedRefreshTime,
  isGitHubActivityData,
  monthMarkers,
} from "../src/lib/githubActivity.ts";

const snapshot = JSON.parse(
  await readFile("src/data/githubActivitySnapshot.json", "utf8"),
);

test("checked-in GitHub activity snapshot matches the public two-account contract", () => {
  assert.equal(isGitHubActivityData(snapshot), true);
  assert.equal(accountFor(snapshot, "personal").login, "basechildren");
  assert.equal(accountFor(snapshot, "academic").login, "PatVraj");
  assert.ok(accountFor(snapshot, "personal").totalContributions > 0);
  assert.ok(accountFor(snapshot, "academic").totalContributions > 0);
  assert.doesNotMatch(JSON.stringify(snapshot), /IBS-Vraj/);
});

test("combined GitHub contribution counts reconcile by day and account", () => {
  const personal = accountFor(snapshot, "personal");
  const academic = accountFor(snapshot, "academic");
  const personalTotal = snapshot.days.reduce(
    (total: number, day: { personalCount: number }) => total + day.personalCount,
    0,
  );
  const academicTotal = snapshot.days.reduce(
    (total: number, day: { academicCount: number }) => total + day.academicCount,
    0,
  );

  assert.equal(personalTotal, personal.totalContributions);
  assert.equal(academicTotal, academic.totalContributions);
  assert.equal(snapshot.totalContributions, personalTotal + academicTotal);
  assert.ok(
    snapshot.days.every(
      (day: { total: number; personalCount: number; academicCount: number }) =>
        day.total === day.personalCount + day.academicCount,
    ),
  );
});

test("calendar helpers preserve overlay source and useful month markers", () => {
  assert.equal(
    activitySource({ personalCount: 1, academicCount: 0 } as never),
    "personal",
  );
  assert.equal(
    activitySource({ personalCount: 0, academicCount: 1 } as never),
    "academic",
  );
  assert.equal(
    activitySource({ personalCount: 1, academicCount: 1 } as never),
    "both",
  );

  const markers = monthMarkers(snapshot.days);
  assert.ok(markers.length >= 11);
  assert.equal(markers[0]?.label, "Sep");
  assert.ok(markers.every(({ week }, index) => index === 0 || week > markers[index - 1].week));
});

test("refresh time keeps a deterministic UTC fallback before local enhancement", () => {
  assert.equal(
    formattedRefreshTime("2026-08-28T00:42:00.000Z"),
    "Aug 28, 2026, 12:42 AM UTC",
  );
});
