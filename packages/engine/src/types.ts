import { z } from "zod";

// Account types — the 5 fundamental account categories
export const AccountTypeSchema = z.enum([
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
]);
export type AccountType = z.infer<typeof AccountTypeSchema>;

// Account definition
export const AccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: AccountTypeSchema,
  parentCode: z.string().optional(),
  siiClassifier: z.string().optional(),
  description: z.string().optional(),
});
export type Account = z.infer<typeof AccountSchema>;

// Entry line (one side of a journal entry)
export const EntryLineSchema = z.object({
  accountCode: z.string().min(1),
  debit: z.number().int().min(0),
  credit: z.number().int().min(0),
});
export type EntryLine = z.infer<typeof EntryLineSchema>;

// Journal entry (the atomic unit of accounting)
export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1),
  lines: z.array(EntryLineSchema).min(2),
  metadata: z.record(z.unknown()).optional(),
  voidedBy: z.string().uuid().optional(),
  voidsEntry: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

// Period
export const FiscalPeriodSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});
export type FiscalPeriod = z.infer<typeof FiscalPeriodSchema>;

// Period status
export type PeriodStatus = "open" | "closed" | "locked";

// Ledger configuration
export const LedgerConfigSchema = z.object({
  companyRut: z.string().optional(),
  companyName: z.string().optional(),
  regime: z.enum(["14A", "14D-N3", "14D-N8"]).optional(),
  currency: z.literal("CLP").default("CLP"),
});
export type LedgerConfig = z.infer<typeof LedgerConfigSchema>;

// Normal balance direction
export type NormalBalance = "debit" | "credit";

// Account balance (computed)
export interface AccountBalance {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
}

// Trial balance
export interface TrialBalance {
  period: FiscalPeriod;
  accounts: AccountBalance[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

// Balance de 8 Columnas (Chilean standard)
export interface Balance8ColumnasRow {
  accountCode: string;
  accountName: string;
  debitMovement: number;
  creditMovement: number;
  debitBalance: number;
  creditBalance: number;
  activo: number;
  pasivo: number;
  perdida: number;
  ganancia: number;
}

export interface Balance8Columnas {
  period: FiscalPeriod;
  rows: Balance8ColumnasRow[];
  totals: {
    debitMovement: number;
    creditMovement: number;
    debitBalance: number;
    creditBalance: number;
    activo: number;
    pasivo: number;
    perdida: number;
    ganancia: number;
  };
}

// Income Statement (Estado de Resultados)
export interface IncomeStatement {
  period: FiscalPeriod;
  revenue: { accounts: AccountBalance[]; total: number };
  costOfSales: { accounts: AccountBalance[]; total: number };
  grossProfit: number;
  operatingExpenses: { accounts: AccountBalance[]; total: number };
  operatingIncome: number;
  otherIncome: { accounts: AccountBalance[]; total: number };
  otherExpenses: { accounts: AccountBalance[]; total: number };
  incomeTax: { accounts: AccountBalance[]; total: number };
  netIncome: number;
}

// Balance Sheet (Balance General)
export interface BalanceSheet {
  period: FiscalPeriod;
  assets: {
    current: AccountBalance[];
    fixed: AccountBalance[];
    other: AccountBalance[];
    total: number;
  };
  liabilities: {
    current: AccountBalance[];
    longTerm: AccountBalance[];
    total: number;
  };
  equity: {
    accounts: AccountBalance[];
    total: number;
  };
  isBalanced: boolean;
}

// IVA result
export interface IvaResult {
  debitoFiscal: number;
  creditoFiscal: number;
  ivaRemanenteAnterior: number;
  ivaDeterminado: number;
  ivaRemanente: number;
}

// PPM result
export interface PpmConfig {
  regime: "14A" | "14D-N3" | "14D-N8";
  rate?: number;
}

export interface PpmResult {
  baseImponible: number;
  rate: number;
  ppmAmount: number;
}

// Correccion Monetaria result
export interface CorreccionMonetariaResult {
  capitalPropioInicial: number;
  revalorizacion: number;
  entries: JournalEntry[];
}

// F29 result
export interface F29Config {
  regime: "14A" | "14D-N3" | "14D-N8";
  ivaRemanenteAnterior?: number;
}

export interface F29Data {
  period: FiscalPeriod;
  iva: IvaResult;
  ppm: PpmResult;
  totalToPay: number;
  fields: Record<string, number>;
}

// Entry template (from generators)
export interface EntryTemplate {
  description: string;
  lines: Array<{ accountCode: string; debit: number; credit: number }>;
  metadata: Record<string, unknown>;
}

// Generator input types
export interface InvoiceInput {
  type: "venta" | "compra";
  folio: number;
  date: string;
  neto: number;
  iva: number;
  total: number;
  exento?: number;
  paymentMethod?: "efectivo" | "banco" | "credito";
}

export interface PayrollInput {
  period: string;
  date: string;
  sueldosBrutos: number;
  afpEmpleador: number;
  afpTrabajador: number;
  saludEmpleador: number;
  saludTrabajador: number;
  seguroCesantiaEmpleador: number;
  seguroCesantiaTrabajador: number;
  impuestoUnico: number;
  totalHaberes: number;
  totalDescuentos: number;
  liquidoAPagar: number;
}

export interface RcvInput {
  type: "compra" | "venta";
  documentType: string;
  folio: number;
  date: string;
  rut: string;
  razonSocial: string;
  neto: number;
  exento: number;
  iva: number;
  total: number;
}
