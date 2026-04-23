import { accountingSchema } from "./_schema.js";
import { uuid, text, timestamp, unique } from "drizzle-orm/pg-core";

export const accounts = accountingSchema.table("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // asset, liability, equity, revenue, expense
  parentCode: text("parent_code"),
  siiClassifier: text("sii_classifier"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  unique("uq_accounts_tenant_code").on(table.tenantId, table.code),
]);

export type AccountRow = typeof accounts.$inferSelect;
export type NewAccountRow = typeof accounts.$inferInsert;
