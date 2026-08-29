export const CONSENT_STORAGE_KEY = "vrajmpatel-analytics-consent";
export const CONSENT_NOTICE_KEY = "vrajmpatel-analytics-notice";
export const CONSENT_CHANGE_EVENT = "vraj:consent-change";

export type PostHogConsent = {
  analytics: boolean;
  replay: boolean;
};

export const defaultConsent = (): PostHogConsent => ({
  analytics: true,
  replay: true,
});

export const optedOutConsent = (): PostHogConsent => ({
  analytics: false,
  replay: false,
});

export const isProductionAnalyticsHost = (hostname: string) =>
  hostname === "vrajmpatel.com" || hostname === "www.vrajmpatel.com";

export const hasBrowserPrivacySignal = (
  nav: Pick<Navigator, "doNotTrack"> & { globalPrivacyControl?: boolean } = navigator,
) =>
  nav.doNotTrack === "1" || nav.globalPrivacyControl === true;

export const parseStoredConsent = (
  raw: string | null | undefined,
): PostHogConsent | null => {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "analytics" in parsed &&
      "replay" in parsed &&
      typeof parsed.analytics === "boolean" &&
      typeof parsed.replay === "boolean"
    ) {
      return {
        analytics: parsed.analytics,
        replay: parsed.replay,
      };
    }
  } catch {
    return null;
  }

  return null;
};

export const serializeConsent = (consent: PostHogConsent) =>
  JSON.stringify({
    analytics: Boolean(consent.analytics),
    replay: Boolean(consent.replay),
  });

export const hasTrackingGrant = (consent: PostHogConsent) =>
  consent.analytics || consent.replay;
