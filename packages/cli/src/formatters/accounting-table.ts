/**
 * Column definitions and formatting helpers for accounting CLI output tables
 */

import { writeFileSync } from "node:fs";
import { formatCLP } from "@emisso/accounting";
import type { Column } from "@emisso/cli-core";
import { CliError } from "@emisso/cli-core";
import { Effect, Option as O } from "effect";

/* ── Column definitions ────────────────────────────────────────── */

export const chartColumns: Column[] = [
  { key: "code", label: "Code", width: 14 },
  { key: "name", label: "Name", width: 30 },
  { key: "type", label: "Type", width: 10 },
  { key: "parentCode", label: "Parent", width: 14 },
  { key: "normalBalance", label: "Normal", width: 8 },
];

export const entryColumns: Column[] = [
  { key: "id", label: "ID", width: 10 },
  { key: "date", label: "Date", width: 12 },
  { key: "description", label: "Description", width: 30 },
  { key: "totalDebit", label: "Debit", align: "right" },
  { key: "totalCredit", label: "Credit", align: "right" },
];

export const entryLineColumns: Column[] = [
  { key: "accountCode", label: "Account", width: 14 },
  { key: "accountName", label: "Name", width: 25 },
  { key: "debit", label: "Debit", align: "right" },
  { key: "credit", label: "Credit", align: "right" },
];

export const trialBalanceColumns: Column[] = [
  { key: "accountCode", label: "Code", width: 14 },
  { key: "accountName", label: "Account", width: 30 },
  { key: "debit", label: "Debit", align: "right" },
  { key: "credit", label: "Credit", align: "right" },
];

export const balance8Columns: Column[] = [
  { key: "accountCode", label: "Code", width: 14 },
  { key: "accountName", label: "Account", width: 22 },
  { key: "debitMovement", label: "Deb Mov", align: "right" },
  { key: "creditMovement", label: "Cre Mov", align: "right" },
  { key: "debitBalance", label: "Deb Bal", align: "right" },
  { key: "creditBalance", label: "Cre Bal", align: "right" },
  { key: "activo", label: "Activo", align: "right" },
  { key: "pasivo", label: "Pasivo", align: "right" },
  { key: "perdida", label: "Pérdida", align: "right" },
  { key: "ganancia", label: "Ganancia", align: "right" },
];

export const incomeStatementColumns: Column[] = [
  { key: "concept", label: "Concepto", width: 35 },
  { key: "amount", label: "Monto (CLP)", align: "right" },
];

export const balanceSheetColumns: Column[] = [
  { key: "concept", label: "Concepto", width: 35 },
  { key: "amount", label: "Monto (CLP)", align: "right" },
];

export const ivaColumns: Column[] = [
  { key: "field", label: "Campo", width: 25 },
  { key: "value", label: "Valor", align: "right" },
];

export const f29Columns: Column[] = [
  { key: "field", label: "Campo", width: 30 },
  { key: "value", label: "Valor", align: "right" },
];

export const periodColumns: Column[] = [
  { key: "period", label: "Período", width: 10 },
  { key: "status", label: "Estado", width: 10 },
  { key: "closedAt", label: "Cerrado", width: 22 },
  { key: "lockedAt", label: "Bloqueado", width: 22 },
];

export const keyValueColumns: Column[] = [
  { key: "field", label: "Campo" },
  { key: "value", label: "Valor" },
];

/* ── Formatting helpers ────────────────────────────────────────── */

interface EntryLine {
  accountCode: string;
  debit: number;
  credit: number;
}

interface Chart {
  getAccount(code: string): { name: string } | undefined;
}

/** Map journal entry lines to display rows with account names and formatted CLP amounts */
export function formatEntryLines(lines: EntryLine[], chart: Chart) {
  return lines.map((line) => {
    const account = chart.getAccount(line.accountCode);
    return {
      accountCode: line.accountCode,
      accountName: account?.name ?? "",
      debit: line.debit > 0 ? formatCLP(line.debit) : "",
      credit: line.credit > 0 ? formatCLP(line.credit) : "",
    };
  });
}

/** Write XML to file or stdout, rendering a summary when writing to file */
export function writeXmlOutput(
  xml: string,
  output: O.Option<string>,
): Effect.Effect<void, CliError> {
  const outputPath = O.getOrUndefined(output);
  if (outputPath) {
    return Effect.try({
      try: () => writeFileSync(outputPath, xml, "utf-8"),
      catch: (error) => new CliError({
        kind: "general",
        message: `Failed to write XML: ${outputPath}`,
        detail: error instanceof Error ? error.message : String(error),
      }),
    });
  }
  return Effect.sync(() => process.stdout.write(xml + "\n"));
}
