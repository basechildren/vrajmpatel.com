import assert from "node:assert/strict";
import test from "node:test";

import type { CaptureResult } from "posthog-js";

import {
  filterConsentedPostHogEvent,
  isAllowedPostHogEvent,
  isPostHogProjectToken,
  sanitizePostHogEvent,
} from "../src/lib/posthogPrivacy.ts";

test("accepts only bounded public PostHog project tokens", () => {
  assert.equal(isPostHogProjectToken("phc_ci_build_only"), true);
  assert.equal(
    isPostHogProjectToken(
      "phc_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    ),
    true,
  );
  assert.equal(isPostHogProjectToken("phx_personal_api_key"), false);
  assert.equal(isPostHogProjectToken("phc_short"), false);
  assert.equal(isPostHogProjectToken("phc_contains.period"), false);
  assert.equal(isPostHogProjectToken(undefined), false);
});

test("allows the consented analytics, heatmap, and replay event set", () => {
  for (const eventName of [
    "$pageview",
    "$pageleave",
    "$autocapture",
    "$web_vitals",
    "$heatmap",
    "$$heatmap",
    "$snapshot",
    "$snapshot_item",
    "resume_clicked",
  ]) {
    assert.equal(isAllowedPostHogEvent(eventName), true);
  }

  assert.equal(isAllowedPostHogEvent("$exception"), false);
  assert.equal(isAllowedPostHogEvent("identify"), false);
});

test("keeps referrer and UTM while dropping click ids and URL query state", () => {
  const event: CaptureResult = {
    uuid: "00000000-0000-7000-8000-000000000000",
    event: "$pageview",
    properties: {
      $current_url: "https://vrajmpatel.com/projects?gclid=abc#section",
      $pathname: "/projects",
      project: "operational-ticket-intelligence",
      utm_source: "linkedin",
      utm_medium: "social",
      utm_campaign: "portfolio",
      gclid: "private-click-id",
      fbclid: "private-click-id",
      $referrer: "https://www.linkedin.com/in/vrajmp/",
      $referring_domain: "www.linkedin.com",
      $search_engine: "google",
      ph_keyword: "systems-integration",
      $initial_utm_source: "linkedin",
      $initial_gclid: "private-click-id",
      $initial_current_url: "https://vrajmpatel.com/?fbclid=private#home",
      $session_entry_url: "https://vrajmpatel.com/projects?gclid=abc",
      $session_entry_referrer: "https://www.linkedin.com/in/vrajmp/",
      $session_entry_utm_campaign: "portfolio",
      $session_entry_gclid: "private-click-id",
    },
    $set: {
      $current_url: "https://vrajmpatel.com/about?private=value#profile",
      resource: "resume",
      fbclid: "private-click-id",
      $initial_referrer: "https://www.linkedin.com/in/vrajmp/",
    },
    $set_once: {
      $current_url: "https://vrajmpatel.com/?utm_source=linkedin#home",
      placement: "header",
      $initial_gclid: "private-click-id",
      utm_medium: "social",
    },
  };

  assert.deepEqual(sanitizePostHogEvent(event), {
    uuid: event.uuid,
    event: "$pageview",
    properties: {
      $current_url: "https://vrajmpatel.com/projects",
      $pathname: "/projects",
      project: "operational-ticket-intelligence",
      utm_source: "linkedin",
      utm_medium: "social",
      utm_campaign: "portfolio",
      $referrer: "https://www.linkedin.com/in/vrajmp/",
      $referring_domain: "www.linkedin.com",
      $search_engine: "google",
      ph_keyword: "systems-integration",
      $initial_utm_source: "linkedin",
      $initial_current_url: "https://vrajmpatel.com/",
      $session_entry_url: "https://vrajmpatel.com/projects",
      $session_entry_referrer: "https://www.linkedin.com/in/vrajmp/",
      $session_entry_utm_campaign: "portfolio",
    },
    $set: {
      $current_url: "https://vrajmpatel.com/about",
      resource: "resume",
      $initial_referrer: "https://www.linkedin.com/in/vrajmp/",
    },
    $set_once: {
      $current_url: "https://vrajmpatel.com/",
      placement: "header",
      utm_medium: "social",
    },
  });
});

test("passes through $pageleave and $web_vitals after sanitizing the current URL", () => {
  const pageleave: CaptureResult = {
    uuid: "00000000-0000-7000-8000-000000000003",
    event: "$pageleave",
    properties: {
      $current_url: "https://vrajmpatel.com/brief?utm_source=linkedin",
      $pathname: "/brief",
      $prev_pageview_duration: 12_400,
    },
  };
  const webVitals: CaptureResult = {
    uuid: "00000000-0000-7000-8000-000000000004",
    event: "$web_vitals",
    properties: {
      $current_url: "https://vrajmpatel.com/?gclid=private#top",
      $pathname: "/",
      $web_vitals_LCP_value: 1.2,
    },
  };

  assert.deepEqual(sanitizePostHogEvent(pageleave)?.properties, {
    $current_url: "https://vrajmpatel.com/brief",
    $pathname: "/brief",
    $prev_pageview_duration: 12_400,
  });
  assert.deepEqual(sanitizePostHogEvent(webVitals)?.properties, {
    $current_url: "https://vrajmpatel.com/",
    $pathname: "/",
    $web_vitals_LCP_value: 1.2,
  });
});

test("passes through heatmap and replay snapshot events", () => {
  const heatmap: CaptureResult = {
    uuid: "00000000-0000-7000-8000-000000000005",
    event: "$heatmap",
    properties: {
      $current_url: "https://vrajmpatel.com/projects?fbclid=private",
      type: "click",
    },
  };
  const snapshot: CaptureResult = {
    uuid: "00000000-0000-7000-8000-000000000006",
    event: "$snapshot",
    properties: {
      $snapshot_data: [{ type: 2, data: { href: "/about" } }],
      $current_url: "https://vrajmpatel.com/about#bio",
    },
  };

  assert.equal(sanitizePostHogEvent(heatmap)?.event, "$heatmap");
  assert.equal(
    sanitizePostHogEvent(heatmap)?.properties?.$current_url,
    "https://vrajmpatel.com/projects",
  );
  assert.deepEqual(sanitizePostHogEvent(snapshot)?.properties, {
    $snapshot_data: [{ type: 2, data: { href: "/about" } }],
    $current_url: "https://vrajmpatel.com/about",
  });
});

test("drops an invalid current URL rather than forwarding it", () => {
  const event: CaptureResult = {
    uuid: "00000000-0000-7000-8000-000000000001",
    event: "resume_clicked",
    properties: { $current_url: "not a URL", resource: "resume" },
  };

  assert.deepEqual(sanitizePostHogEvent(event)?.properties, {
    resource: "resume",
  });
});

test("drops automatic events outside the consented analytics contract", () => {
  const event: CaptureResult = {
    uuid: "00000000-0000-7000-8000-000000000002",
    event: "$exception",
    properties: {
      $current_url: "https://vrajmpatel.com/",
      $pathname: "/",
    },
  };

  assert.equal(sanitizePostHogEvent(event), null);
});

test("passes through a dropped PostHog event", () => {
  assert.equal(sanitizePostHogEvent(null), null);
});

test("enforces independent analytics and replay grants before send", () => {
  const pageview: CaptureResult = {
    uuid: "00000000-0000-7000-8000-000000000007",
    event: "$pageview",
    properties: { $current_url: "https://vrajmpatel.com/" },
  };
  const snapshot: CaptureResult = {
    uuid: "00000000-0000-7000-8000-000000000008",
    event: "$snapshot",
    properties: { $snapshot_data: [] },
  };

  assert.equal(
    filterConsentedPostHogEvent(pageview, { analytics: false, replay: true }),
    null,
  );
  assert.equal(
    filterConsentedPostHogEvent(snapshot, { analytics: true, replay: false }),
    null,
  );
  assert.equal(
    filterConsentedPostHogEvent(pageview, { analytics: true, replay: false })
      ?.event,
    "$pageview",
  );
  assert.equal(
    filterConsentedPostHogEvent(snapshot, { analytics: false, replay: true })
      ?.event,
    "$snapshot",
  );
});
