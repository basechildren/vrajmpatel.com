import type { CaptureResult, Properties } from "posthog-js";

const publicProjectTokenPattern = /^phc_[A-Za-z0-9_-]{8,128}$/;

export const isPostHogProjectToken = (value: string | undefined) =>
  Boolean(value && publicProjectTokenPattern.test(value));

const campaignPropertyNames = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gad_source",
  "mc_cid",
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

const referrerPropertyNames = new Set([
  "$referrer",
  "$referring_domain",
  "$search_engine",
  "ph_keyword",
]);

const isAttributionProperty = (propertyName: string) =>
  propertyName.startsWith("$session_entry_") ||
  propertyName.startsWith("$initial_") ||
  referrerPropertyNames.has(propertyName) ||
  campaignPropertyNames.has(propertyName);

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

const scrubAttribution = (properties: Properties | undefined) => {
  if (!properties) return properties;

  const sanitizedProperties: Properties = {};
  for (const [propertyName, value] of Object.entries(properties)) {
    if (isAttributionProperty(propertyName)) continue;

    if (propertyName === "$current_url") {
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
 * PostHog enriches capture payloads after caller properties are supplied, so
 * this hook removes campaign, referrer, search, and session-entry attribution,
 * and strips queries and fragments from current URLs, immediately before
 * transport.
 */
export const sanitizePostHogEvent = (
  event: CaptureResult | null,
): CaptureResult | null => {
  if (!event) return null;

  return {
    ...event,
    properties: scrubAttribution(event.properties) ?? {},
    ...(event.$set ? { $set: scrubAttribution(event.$set) } : {}),
    ...(event.$set_once
      ? { $set_once: scrubAttribution(event.$set_once) }
      : {}),
  };
};
