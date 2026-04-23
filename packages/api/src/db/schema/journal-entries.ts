import { accountingSchema } from "./_schema.js";
import { uuid, text, date, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const journalEntries = accountingSchema.table("journal_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  voidedBy: uuid("voided_by"),
  voidsEntry: uuid("voids_entry"),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type JournalEntryRow = typeof journalEntries.$inferSelect;
export type NewJournalEntryRow = typeof journalEntries.$inferInsert;
