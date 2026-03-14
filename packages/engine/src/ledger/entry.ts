import type { JournalEntry, EntryLine } from "../types.js";
import type { Chart } from "../accounts/chart.js";
import { roundCLP } from "../money.js";

export interface EntryBuilder {
  date(date: string): EntryBuilder;
  debit(accountCode: string, amount: number): EntryBuilder;
  credit(accountCode: string, amount: number): EntryBuilder;
  meta(metadata: Record<string, unknown>): EntryBuilder;
  commit(): JournalEntry;
}

export function createEntryBuilder(
  description: string,
  chart: Chart,
  onCommit: (entry: JournalEntry) => void,
): EntryBuilder {
  let entryDate: string | undefined;
  const lines: EntryLine[] = [];
  let metadata: Record<string, unknown> | undefined;

  const builder: EntryBuilder = {
    date(date: string): EntryBuilder {
      // Validate date format YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
      }
      entryDate = date;
      return builder;
    },

    debit(accountCode: string, amount: number): EntryBuilder {
      if (amount < 0) throw new Error(`Debit amount must be non-negative: ${amount}`);
      if (amount === 0) return builder;
      if (!chart.validateCode(accountCode)) {
        throw new Error(`Account not found: ${accountCode}`);
      }
      lines.push({ accountCode, debit: roundCLP(amount), credit: 0 });
      return builder;
    },

    credit(accountCode: string, amount: number): EntryBuilder {
      if (amount < 0) throw new Error(`Credit amount must be non-negative: ${amount}`);
      if (amount === 0) return builder;
      if (!chart.validateCode(accountCode)) {
        throw new Error(`Account not found: ${accountCode}`);
      }
      lines.push({ accountCode, debit: 0, credit: roundCLP(amount) });
      return builder;
    },

    meta(data: Record<string, unknown>): EntryBuilder {
      metadata = data;
      return builder;
    },

    commit(): JournalEntry {
      if (!entryDate) {
        throw new Error("Entry date is required");
      }
      if (lines.length < 2) {
        throw new Error("Journal entry must have at least 2 lines");
      }

      const totalDebits = lines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredits = lines.reduce((sum, l) => sum + l.credit, 0);

      if (totalDebits !== totalCredits) {
        throw new Error(
          `Entry is not balanced: debits=${totalDebits}, credits=${totalCredits}`,
        );
      }

      const entry: JournalEntry = {
        id: crypto.randomUUID(),
        date: entryDate,
        description,
        lines: [...lines],
        metadata,
        createdAt: new Date().toISOString(),
      };

      onCommit(entry);
      return entry;
    },
  };

  return builder;
}
