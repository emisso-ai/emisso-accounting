import { accountingSchema } from "./_schema.js";
import { uuid, integer, text, timestamp, unique } from "drizzle-orm/pg-core";

export const periods = accountingSchema.table("periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  status: text("status").notNull().default("open"), // open, closed, locked
  closedAt: timestamp("closed_at"),
  lockedAt: timestamp("locked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  unique("uq_periods_tenant_year_month").on(table.tenantId, table.year, table.month),
]);

export type PeriodRow = typeof periods.$inferSelect;
export type NewPeriodRow = typeof periods.$inferInsert;
