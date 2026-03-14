import { z } from "zod";

// ── Account ──

export const UpsertAccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  parentCode: z.string().optional(),
  siiClassifier: z.string().optional(),
  description: z.string().optional(),
});
export type UpsertAccountInput = z.infer<typeof UpsertAccountSchema>;

// ── Entry ──

export const CreateEntryLineSchema = z.object({
  accountCode: z.string().min(1),
  debit: z.number().int().min(0),
  credit: z.number().int().min(0),
});

export const CreateEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1),
  lines: z.array(CreateEntryLineSchema).min(2),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateEntryInput = z.infer<typeof CreateEntrySchema>;

export const VoidEntrySchema = z.object({
  reason: z.string().min(1),
});
export type VoidEntryInput = z.infer<typeof VoidEntrySchema>;

// ── Period ──

export const PeriodQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});
export type PeriodQuery = z.infer<typeof PeriodQuerySchema>;

export const OpenPeriodSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});
export type OpenPeriodInput = z.infer<typeof OpenPeriodSchema>;

export const UpdatePeriodSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  status: z.enum(["closed", "locked"]),
});
export type UpdatePeriodInput = z.infer<typeof UpdatePeriodSchema>;

// ── Entry queries ──

export const ListEntriesQuerySchema = PeriodQuerySchema;
export type ListEntriesQuery = PeriodQuery;

// ── Report queries ──

export const ReportQuerySchema = PeriodQuerySchema;
export type ReportQuery = PeriodQuery;

// ── Tax queries ──

export const TaxQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  regime: z.enum(["14A", "14D-N3", "14D-N8"]).optional(),
  ivaRemanenteAnterior: z.coerce.number().int().min(0).optional(),
});
export type TaxQuery = z.infer<typeof TaxQuerySchema>;
