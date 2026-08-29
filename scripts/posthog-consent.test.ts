import assert from "node:assert/strict";
import test from "node:test";

import {
  CONSENT_STORAGE_KEY,
  defaultConsent,
  hasBrowserPrivacySignal,
  hasTrackingGrant,
  isProductionAnalyticsHost,
  parseStoredConsent,
  serializeConsent,
} from "../src/lib/posthogConsent.ts";

test("defaults both analytics and replay grants to off", () => {
  assert.deepEqual(defaultConsent(), { analytics: false, replay: false });
  assert.equal(hasTrackingGrant(defaultConsent()), false);
});

test("parses only complete boolean consent records", () => {
  assert.equal(parseStoredConsent(null), null);
  assert.equal(parseStoredConsent("{"), null);
  assert.equal(parseStoredConsent('{"analytics":true}'), null);
  assert.equal(
    parseStoredConsent('{"analytics":"yes","replay":false}'),
    null,
  );
  assert.deepEqual(parseStoredConsent('{"analytics":true,"replay":false}'), {
    analytics: true,
    replay: false,
  });
  assert.equal(
    serializeConsent({ analytics: true, replay: true }),
    '{"analytics":true,"replay":true}',
  );
  assert.equal(CONSENT_STORAGE_KEY, "vrajmpatel-analytics-consent");
});

test("treats either grant as enough to enable PostHog capturing", () => {
  assert.equal(hasTrackingGrant({ analytics: true, replay: false }), true);
  assert.equal(hasTrackingGrant({ analytics: false, replay: true }), true);
  assert.equal(hasTrackingGrant({ analytics: true, replay: true }), true);
});

test("limits production ingest to the canonical site hosts", () => {
  assert.equal(isProductionAnalyticsHost("vrajmpatel.com"), true);
  assert.equal(isProductionAnalyticsHost("www.vrajmpatel.com"), true);
  assert.equal(isProductionAnalyticsHost("localhost"), false);
  assert.equal(isProductionAnalyticsHost("patvraj.github.io"), false);
});

test("honors DNT and Global Privacy Control as a full opt-out", () => {
  assert.equal(hasBrowserPrivacySignal({ doNotTrack: "1" }), true);
  assert.equal(
    hasBrowserPrivacySignal({ doNotTrack: null, globalPrivacyControl: true }),
    true,
  );
  assert.equal(
    hasBrowserPrivacySignal({ doNotTrack: "0", globalPrivacyControl: false }),
    false,
  );
  assert.equal(hasBrowserPrivacySignal({ doNotTrack: null }), false);
});
