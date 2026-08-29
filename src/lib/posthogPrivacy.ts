import type { CaptureResult, Properties } from "posthog-js";

const publicProjectTokenPattern = /^phc_[A-Za-z0-9_-]{8,128}$/;

const allowedEventNames = new Set([
  "$pageview",
  "$pageleave",
  "$autocapture",
  "$web_vitals",
  "$heatmap",
  "$$heatmap",
  "$snapshot",
  "outbound_link_clicked",
  "project_opened",
  "resume_clicked",
  "social_profile_clicked",
]);

const allowedEventPrefixes = ["$snapshot", "$heatmap", "$$heatmap"] as const;

const clickIdPropertyNames = new Set([
  "gclid",
  "gclsrc",
  "dclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "msclkid",
  "twclid",
  "li_fat_id",
  "igshid",
  "ttclid",
  "rdt_cid",
  "epik",
  "qclid",
  "sccid",
  "irclid",
  "_kx",
]);

const currentUrlPropertyNames = new Set([
  "$current_url",
  "$initial_current_url",
  "$session_entry_url",
]);

export const isPostHogProjectToken = (value: string | undefined) =>
  Boolean(value && publicProjectTokenPattern.test(value));

export const isReplayPostHogEvent = (eventName: string) =>
  eventName === "$snapshot" || eventName.startsWith("$snapshot");

export const isAllowedPostHogEvent = (eventName: string) =>
  allowedEventNames.has(eventName) ||
  allowedEventPrefixes.some(
    (prefix) => eventName === prefix || eventName.startsWith(`${prefix}_`),
  );

const clickIdSuffix = (propertyName: string) => {
  if (clickIdPropertyNames.has(propertyName)) return true;

  const withoutPrefixes = propertyName
    .replace(/^\$session_entry_/, "")
    .replace(/^\$initial_/, "")
    .replace(/^\$/, "");

  return clickIdPropertyNames.has(withoutPrefixes);
};

const sanitizeCurrentUrl = (value: unknown) => {
  if (typeof value !== "string") return undefined;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return undefined;
    }

    return url.origin + url.pathname;
  } catch {
    return undefined;
  }
};

const scrubProperties = (properties: Properties | undefined) => {
  if (!properties) return properties;

  const sanitizedProperties: Properties = {};
  for (const [propertyName, value] of Object.entries(properties)) {
    if (clickIdSuffix(propertyName)) continue;

    if (currentUrlPropertyNames.has(propertyName)) {
      const sanitizedUrl = sanitizeCurrentUrl(value);
      if (sanitizedUrl) sanitizedProperties[propertyName] = sanitizedUrl;
      continue;
    }

    sanitizedProperties[propertyName] = value;
  }

  return sanitizedProperties;
};

/**
 * Final outbound privacy boundary for PostHog events.
 *
 * After analytics consent, this hook keeps pageviews, pageleaves,
 * autocapture, web vitals, heatmaps, replay snapshots, and the site's custom
 * events. Query strings and fragments are stripped from current URLs. Click
 * identifiers are dropped. Referrer and UTM properties are kept. Independent
 * opt-outs are applied at send time.
 */
export const sanitizePostHogEvent = (
  event: CaptureResult | null,
): CaptureResult | null => {
  if (!event || !isAllowedPostHogEvent(event.event)) return null;

  return {
    ...event,
    properties: scrubProperties(event.properties) ?? {},
    ...(event.$set ? { $set: scrubProperties(event.$set) } : {}),
    ...(event.$set_once
      ? { $set_once: scrubProperties(event.$set_once) }
      : {}),
  };
};

export const filterConsentedPostHogEvent = (
  event: CaptureResult | null,
  consent: { analytics: boolean; replay: boolean },
): CaptureResult | null => {
  if (!event) return null;

  if (isReplayPostHogEvent(event.event)) {
    return consent.replay ? sanitizePostHogEvent(event) : null;
  }

  if (!consent.analytics) return null;
  return sanitizePostHogEvent(event);
};

