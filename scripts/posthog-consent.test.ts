import assert from "node:assert/strict";
import test from "node:test";

import {
  CONSENT_NOTICE_KEY,
  CONSENT_STORAGE_KEY,
  defaultConsent,
  hasBrowserPrivacySignal,
  hasTrackingGrant,
  isProductionAnalyticsHost,
  optedOutConsent,
  parseStoredConsent,
  serializeConsent,
} from "../src/lib/posthogConsent.ts";

test("defaults both analytics and replay to on", () => {
  assert.deepEqual(defaultConsent(), { analytics: true, replay: true });
  assert.equal(hasTrackingGrant(defaultConsent()), true);
  assert.deepEqual(optedOutConsent(), { analytics: false, replay: false });
  assert.equal(hasTrackingGrant(optedOutConsent()), false);
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
  assert.deepEqual(parseStoredConsent('{"analytics":false,"replay":false}'), {
    analytics: false,
    replay: false,
  });
  assert.equal(
    serializeConsent({ analytics: true, replay: true }),
    '{"analytics":true,"replay":true}',
  );
  assert.equal(CONSENT_STORAGE_KEY, "vrajmpatel-analytics-consent");
  assert.equal(CONSENT_NOTICE_KEY, "vrajmpatel-analytics-notice");
});

test("treats either remaining grant as enough to keep PostHog capturing", () => {
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
