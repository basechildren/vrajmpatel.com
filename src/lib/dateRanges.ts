const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ENDPOINT = /^(?<month>[A-Z][a-z]+)(?: \d{1,2})?(?:,? (?<year>\d{4}))?$/;

/**
 * Shortens a role or appointment period for display, e.g. "January 15, 2025 – May 2026" → "Jan 2025 – May 2026".
 * Content keeps the exact dates. A start without a year ("January 21 – April 13, 2024") takes the end's year.
 */
export function formatPeriod(period: string): string {
  const fail = () => new Error(`Unrecognized experience period: "${period}"`);
  const [start, end, ...rest] = period.split(/\s*–\s*/);
  if (!start || !end || rest.length) throw fail();
  const parse = (value: string) => {
    const match = ENDPOINT.exec(value);
    if (!match?.groups || !MONTHS.includes(match.groups.month)) throw fail();
    // en-US short month names are the first three letters ("Sep", not "Sept").
    return { month: match.groups.month.slice(0, 3), year: match.groups.year };
  };
  const from = parse(start);
  if (end === "Present") {
    if (!from.year) throw fail();
    return `${from.month} ${from.year} – Present`;
  }
  const to = parse(end);
  if (!to.year) throw fail();
  return `${from.month} ${from.year ?? to.year} – ${to.month} ${to.year}`;
}
