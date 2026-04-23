/**
 * @emisso/accounting-api — Drizzle schema exports
 * All tables live in the PostgreSQL `accounting` schema.
 */

export { accountingSchema } from "./_schema.js";

export { accounts } from "./accounts.js";
export type { AccountRow, NewAccountRow } from "./accounts.js";

export { journalEntries } from "./journal-entries.js";
export type { JournalEntryRow, NewJournalEntryRow } from "./journal-entries.js";

export { entryLines } from "./entry-lines.js";
export type { EntryLineRow, NewEntryLineRow } from "./entry-lines.js";

export { periods } from "./periods.js";
export type { PeriodRow, NewPeriodRow } from "./periods.js";
