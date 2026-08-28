export type GitHubAccountKey = "personal" | "academic";

export interface GitHubActivityAccount {
  key: GitHubAccountKey;
  label: "Personal" | "Academic";
  login: string;
  url: `https://github.com/${string}`;
  totalContributions: number;
}

export interface GitHubActivityDay {
  date: string;
  personalCount: number;
  personalLevel: number;
  academicCount: number;
  academicLevel: number;
  total: number;
}

export interface GitHubActivityData {
  schemaVersion: 1;
  generatedAt: string;
  source: string;
  range: {
    from: string;
    to: string;
  };
  accounts: GitHubActivityAccount[];
  totalContributions: number;
  days: GitHubActivityDay[];
}

export const activityPalettes = {
  personal: ["#e2e8f0", "#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8"],
  academic: ["#e2e8f0", "#dcfce7", "#86efac", "#22c55e", "#15803d"],
} as const;

const accountKeys = new Set<GitHubAccountKey>(["personal", "academic"]);

const isIntegerAtLeastZero = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0;

const isLevel = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 4;

export function isGitHubActivityData(value: unknown): value is GitHubActivityData {
  if (!value || typeof value !== "object") return false;

  const data = value as Partial<GitHubActivityData>;
  if (
    data.schemaVersion !== 1 ||
    typeof data.generatedAt !== "string" ||
    typeof data.source !== "string" ||
    !data.range ||
    typeof data.range.from !== "string" ||
    typeof data.range.to !== "string" ||
    !Array.isArray(data.accounts) ||
    data.accounts.length !== 2 ||
    !isIntegerAtLeastZero(data.totalContributions) ||
    !Array.isArray(data.days) ||
    data.days.length < 350 ||
    data.days.length > 371
  ) {
    return false;
  }

  const validAccounts = data.accounts.every(
    (account) =>
      account &&
      accountKeys.has(account.key) &&
      typeof account.label === "string" &&
      typeof account.login === "string" &&
      typeof account.url === "string" &&
      account.url === `https://github.com/${account.login}` &&
      isIntegerAtLeastZero(account.totalContributions),
  );
  if (!validAccounts || new Set(data.accounts.map(({ key }) => key)).size !== 2) {
    return false;
  }

  return data.days.every(
    (day) =>
      day &&
      /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
      isIntegerAtLeastZero(day.personalCount) &&
      isLevel(day.personalLevel) &&
      isIntegerAtLeastZero(day.academicCount) &&
      isLevel(day.academicLevel) &&
      isIntegerAtLeastZero(day.total) &&
      day.total === day.personalCount + day.academicCount,
  );
}

export function accountFor(
  data: GitHubActivityData,
  key: GitHubAccountKey,
): GitHubActivityAccount {
  const account = data.accounts.find((candidate) => candidate.key === key);
  if (!account) throw new Error(`Missing ${key} GitHub account`);
  return account;
}

export function activitySource(day: GitHubActivityDay) {
  if (day.personalCount > 0 && day.academicCount > 0) return "both";
  if (day.personalCount > 0) return "personal";
  if (day.academicCount > 0) return "academic";
  return "none";
}

export function activityColors(day: GitHubActivityDay) {
  return {
    personal: activityPalettes.personal[day.personalLevel],
    academic: activityPalettes.academic[day.academicLevel],
  };
}

export function activityLabel(day: GitHubActivityDay) {
  const date = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day.date}T00:00:00Z`));
  const totalLabel = `${day.total} contribution${day.total === 1 ? "" : "s"}`;
  return `${date}: ${totalLabel} — ${day.personalCount} personal, ${day.academicCount} academic`;
}

export function monthMarkers(days: GitHubActivityDay[]) {
  const markers: Array<{ label: string; week: number }> = [];
  let previousMonth = "";

  days.forEach((day, index) => {
    const month = day.date.slice(0, 7);
    if (month === previousMonth) return;
    previousMonth = month;

    const week = Math.floor(index / 7) + 1;
    const previous = markers.at(-1);
    const marker = {
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "UTC",
      }).format(new Date(`${day.date}T00:00:00Z`)),
      week,
    };

    if (previous && week - previous.week < 3) {
      markers[markers.length - 1] = marker;
      return;
    }

    markers.push(marker);
  });

  return markers;
}

export function formattedRefreshTime(generatedAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(generatedAt));
}
