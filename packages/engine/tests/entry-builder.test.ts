import { describe, it, expect } from "vitest";
import { createChart } from "../src/accounts/chart.js";
import { createEntryBuilder } from "../src/ledger/entry.js";

function makeChart() {
  const chart = createChart();
  chart.addAccount({ code: "1.1.01.001", name: "Caja", type: "asset" });
  chart.addAccount({ code: "1.1.02.001", name: "Banco", type: "asset" });
  chart.addAccount({ code: "2.1.02.001", name: "IVA DF", type: "liability" });
  chart.addAccount({ code: "4.1.01.001", name: "Ventas", type: "revenue" });
  chart.addAccount({ code: "4.2.01.001", name: "Costo Ventas", type: "expense" });
  return chart;
}

describe("EntryBuilder", () => {
  it("should build a balanced entry", () => {
    const chart = makeChart();
    let committed: any;
    const builder = createEntryBuilder("Venta", chart, (e) => {
      committed = e;
    });

    const entry = builder
      .date("2026-03-01")
      .debit("1.1.01.001", 119_000)
      .credit("4.1.01.001", 100_000)
      .credit("2.1.02.001", 19_000)
      .commit();

    expect(entry.id).toBeDefined();
    expect(entry.description).toBe("Venta");
    expect(entry.date).toBe("2026-03-01");
    expect(entry.lines).toHaveLength(3);
    expect(committed).toBe(entry);
  });

  it("should reject unbalanced entry", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("Bad", chart, () => {});

    expect(() =>
      builder
        .date("2026-03-01")
        .debit("1.1.01.001", 100_000)
        .credit("4.1.01.001", 50_000)
        .commit(),
    ).toThrow("not balanced");
  });

  it("should reject entry with fewer than 2 lines", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("Bad", chart, () => {});

    expect(() =>
      builder.date("2026-03-01").debit("1.1.01.001", 100_000).commit(),
    ).toThrow("at least 2 lines");
  });

  it("should reject entry without date", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("No date", chart, () => {});

    expect(() =>
      builder
        .debit("1.1.01.001", 100_000)
        .credit("4.1.01.001", 100_000)
        .commit(),
    ).toThrow("date is required");
  });

  it("should reject invalid date format", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("Bad date", chart, () => {});

    expect(() => builder.date("03/01/2026")).toThrow("Invalid date format");
  });

  it("should reject non-existent account code", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("Bad code", chart, () => {});

    expect(() =>
      builder.date("2026-03-01").debit("9.9.99.999", 100_000),
    ).toThrow("Account not found");
  });

  it("should reject negative amounts", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("Neg", chart, () => {});

    expect(() =>
      builder.date("2026-03-01").debit("1.1.01.001", -100),
    ).toThrow("non-negative");
  });

  it("should reject negative credit amounts", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("Neg credit", chart, () => {});

    expect(() =>
      builder.date("2026-03-01").credit("4.1.01.001", -500),
    ).toThrow("non-negative");
  });

  it("should attach metadata", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("Meta", chart, () => {});

    const entry = builder
      .date("2026-03-01")
      .debit("1.1.01.001", 100_000)
      .credit("4.1.01.001", 100_000)
      .meta({ folio: 1234, type: "factura" })
      .commit();

    expect(entry.metadata).toEqual({ folio: 1234, type: "factura" });
  });

  it("should generate UUID and timestamp", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("UUID", chart, () => {});

    const entry = builder
      .date("2026-03-01")
      .debit("1.1.01.001", 100_000)
      .credit("4.1.01.001", 100_000)
      .commit();

    expect(entry.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(entry.createdAt).toBeDefined();
  });

  it("should skip zero-amount lines", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("Zero", chart, () => {});

    const entry = builder
      .date("2026-03-01")
      .debit("1.1.01.001", 100_000)
      .debit("1.1.02.001", 0) // should be skipped
      .credit("4.1.01.001", 100_000)
      .commit();

    expect(entry.lines).toHaveLength(2);
  });

  it("should skip zero-amount credit lines", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("Zero credit", chart, () => {});

    const entry = builder
      .date("2026-03-01")
      .debit("1.1.01.001", 100_000)
      .credit("4.1.01.001", 100_000)
      .credit("2.1.02.001", 0) // should be skipped
      .commit();

    expect(entry.lines).toHaveLength(2);
  });

  it("should round amounts to integers", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("Round", chart, () => {});

    const entry = builder
      .date("2026-03-01")
      .debit("1.1.01.001", 100_000.7)
      .credit("4.1.01.001", 100_001)
      .commit();

    // Math.round(100_000.7) = 100_001
    expect(entry.lines[0]!.debit).toBe(100_001);
    expect(entry.lines[1]!.credit).toBe(100_001);
  });

  it("should support compound entries with multiple debits and credits", () => {
    const chart = makeChart();
    const builder = createEntryBuilder("Compound", chart, () => {});

    const entry = builder
      .date("2026-03-01")
      .debit("1.1.01.001", 50_000)
      .debit("1.1.02.001", 50_000)
      .credit("4.1.01.001", 80_000)
      .credit("2.1.02.001", 20_000)
      .commit();

    expect(entry.lines).toHaveLength(4);
    const totalDebits = entry.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredits = entry.lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDebits).toBe(totalCredits);
  });
});
