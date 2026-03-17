import { describe, expect, it } from "vitest";
import { formatTable, formatCsv } from "@emisso/cli-core";
import {
  chartColumns,
  entryColumns,
  entryLineColumns,
  trialBalanceColumns,
  balance8Columns,
  incomeStatementColumns,
  balanceSheetColumns,
  ivaColumns,
  f29Columns,
  periodColumns,
  keyValueColumns,
} from "../src/formatters/accounting-table";

describe("Column definitions", () => {
  const allColumnSets = [
    { name: "chartColumns", columns: chartColumns },
    { name: "entryColumns", columns: entryColumns },
    { name: "entryLineColumns", columns: entryLineColumns },
    { name: "trialBalanceColumns", columns: trialBalanceColumns },
    { name: "balance8Columns", columns: balance8Columns },
    { name: "incomeStatementColumns", columns: incomeStatementColumns },
    { name: "balanceSheetColumns", columns: balanceSheetColumns },
    { name: "ivaColumns", columns: ivaColumns },
    { name: "f29Columns", columns: f29Columns },
    { name: "periodColumns", columns: periodColumns },
    { name: "keyValueColumns", columns: keyValueColumns },
  ];

  for (const { name, columns } of allColumnSets) {
    it(`${name} has valid Column shapes`, () => {
      expect(columns.length).toBeGreaterThan(0);
      for (const col of columns) {
        expect(col).toHaveProperty("key");
        expect(col).toHaveProperty("label");
        expect(typeof col.key).toBe("string");
        expect(typeof col.label).toBe("string");
      }
    });
  }
});

describe("formatTable with entry line columns", () => {
  it("renders entry lines as a table", () => {
    const rows = [
      { accountCode: "1.1.01.001", accountName: "Caja", debit: "$100.000", credit: "" },
      { accountCode: "4.1.01.001", accountName: "Ventas", debit: "", credit: "$100.000" },
    ];

    const output = formatTable(entryLineColumns, rows);
    expect(output).toContain("Account");
    expect(output).toContain("Name");
    expect(output).toContain("Caja");
    expect(output).toContain("Ventas");
    expect(output).toContain("$100.000");
  });
});

describe("formatCsv with chart columns", () => {
  it("renders chart as CSV", () => {
    const csvColumns = chartColumns.map((c) => ({ key: c.key, label: c.label }));
    const rows = [
      { code: "1.1.01.001", name: "Caja", type: "asset", parent: "1.1.01", normalBalance: "debit" },
    ];

    const output = formatCsv(csvColumns, rows);
    expect(output).toContain("Code");
    expect(output).toContain("Caja");
    expect(output).toContain("asset");
  });
});

describe("formatTable with period columns", () => {
  it("renders periods as a table", () => {
    const rows = [
      { period: "2025-01", status: "closed", closedAt: "2025-02-01", lockedAt: "" },
      { period: "2025-02", status: "open", closedAt: "", lockedAt: "" },
    ];

    const output = formatTable(periodColumns, rows);
    expect(output).toContain("Período");
    expect(output).toContain("Estado");
    expect(output).toContain("2025-01");
    expect(output).toContain("closed");
    expect(output).toContain("open");
  });
});
