import type { FiscalPeriod, JournalEntry } from "./types.js";

export function formatPeriod(period: FiscalPeriod): string {
  return `${period.year}-${String(period.month).padStart(2, "0")}`;
}

export function periodDateRange(period: FiscalPeriod): { from: string; to: string } {
  const from = `${period.year}-${String(period.month).padStart(2, "0")}-01`;
  const lastDay = new Date(period.year, period.month, 0).getDate();
  const to = `${period.year}-${String(period.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export function filterEntriesByPeriod(entries: JournalEntry[], period: FiscalPeriod): JournalEntry[] {
  const { from, to } = periodDateRange(period);
  return entries.filter((e) => e.date >= from && e.date <= to);
}
