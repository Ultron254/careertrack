// Fixture timestamps that should read as recent activity are derived from
// the real clock so the demo does not age into "3 years ago" labels.

export const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

export const daysAgo = (days: number) => hoursAgo(days * 24);

export const seeded = (iso: string) => new Date(iso).toISOString();
