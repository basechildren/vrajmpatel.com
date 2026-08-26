import assert from "node:assert/strict";
import test from "node:test";

import type { CaptureResult } from "posthog-js";

import {
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

test("removes PostHog attribution without changing approved properties", () => {
  const event: CaptureResult = {
    uuid: "00000000-0000-7000-8000-000000000000",
    event: "$pageview",
    properties: {
      $current_url: "https://vrajmpatel.com/projects?private=value#section",
      $pathname: "/projects",
      project: "operational-ticket-intelligence",
      utm_source: "private-source",
      gclid: "private-click-id",
      $referrer: "https://example.com/?private=value",
      $referring_domain: "example.com",
      $search_engine: "google",
      ph_keyword: "private-search",
      $initial_current_url: "https://vrajmpatel.com/?private=value",
      $initial_utm_content: "private-campaign",
      $initial_search_engine: "google",
      $initial_ph_keyword: "private-search",
      $initial_host: "vrajmpatel.com",
      $initial_pathname: "/projects",
      $initial_person_info: "private-legacy-value",
      $session_entry_url: "https://vrajmpatel.com/?private=value",
      $session_entry_referrer: "https://example.com/?private=value",
      $session_entry_utm_campaign: "private-campaign",
    },
    $set: {
      $current_url: "https://vrajmpatel.com/about?private=value#profile",
      resource: "resume",
      fbclid: "private-click-id",
      $initial_referrer: "https://example.com/?private=value",
      $initial_host: "vrajmpatel.com",
    },
    $set_once: {
      $current_url: "https://vrajmpatel.com/?private=value#home",
      placement: "header",
      $initial_gclid: "private-click-id",
      $initial_ph_keyword: "private-search",
      $initial_pathname: "/",
      $session_entry_referring_domain: "example.com",
    },
  };

  assert.deepEqual(sanitizePostHogEvent(event), {
    uuid: event.uuid,
    event: "$pageview",
    properties: {
      $current_url: "https://vrajmpatel.com/projects",
      $pathname: "/projects",
      project: "operational-ticket-intelligence",
    },
    $set: {
      $current_url: "https://vrajmpatel.com/about",
      resource: "resume",
    },
    $set_once: {
      $current_url: "https://vrajmpatel.com/",
      placement: "header",
    },
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

test("drops automatic events outside the explicit analytics contract", () => {
  const event: CaptureResult = {
    uuid: "00000000-0000-7000-8000-000000000002",
    event: "$web_vitals",
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
