import { accountingSchema } from "./index.js";
import { uuid, text, numeric } from "drizzle-orm/pg-core";
import { journalEntries } from "./journal-entries.js";

export const entryLines = accountingSchema.table("entry_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  entryId: uuid("entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  accountCode: text("account_code").notNull(),
  debit: numeric("debit", { precision: 16, scale: 0 }).notNull().default("0"),
  credit: numeric("credit", { precision: 16, scale: 0 }).notNull().default("0"),
});

export type EntryLineRow = typeof entryLines.$inferSelect;
export type NewEntryLineRow = typeof entryLines.$inferInsert;
