import { describe, expect, it, afterEach } from "vitest";
import { unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initLedger, loadLedger, saveLedger } from "../src/config/ledger-io";

function tempPath(): string {
  return join(tmpdir(), `test-cmd-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
}

describe("chart seed integration", () => {
  const cleanupPaths: string[] = [];

  afterEach(() => {
    for (const p of cleanupPaths) {
      try { unlinkSync(p); } catch { /* ignore */ }
    }
    cleanupPaths.length = 0;
  });

  it("initLedger creates a ledger with SII chart accounts", () => {
    const path = tempPath();
    cleanupPaths.push(path);

    initLedger(path);
    const ledger = loadLedger(path);
    const accounts = ledger.chart.toArray();

    expect(accounts.length).toBeGreaterThan(100);
  });
});

describe("entry lifecycle", () => {
  const cleanupPaths: string[] = [];

  afterEach(() => {
    for (const p of cleanupPaths) {
      try { unlinkSync(p); } catch { /* ignore */ }
    }
    cleanupPaths.length = 0;
  });

  it("adds, lists, and voids an entry", () => {
    const path = tempPath();
    cleanupPaths.push(path);

    initLedger(path);
    const ledger = loadLedger(path);

    // Add entry
    const entry = ledger
      .entry("Venta de servicios")
      .date("2025-03-15")
      .debit("1.1.01.001", 1190000)
      .credit("4.1.01.001", 1000000)
      .credit("2.1.05.001", 190000)
      .commit();

    saveLedger(path, ledger);

    // List entries
    const entries = ledger.getEntries({});
    expect(entries).toHaveLength(1);
    expect(entries[0].description).toBe("Venta de servicios");

    // Void entry
    const reversal = ledger.void(entry.id, "Correction");
    saveLedger(path, ledger);

    const allEntries = ledger.getEntries({});
    expect(allEntries).toHaveLength(2);
    expect(reversal.lines.length).toBe(entry.lines.length);
  });
});

describe("report generation", () => {
  const cleanupPaths: string[] = [];

  afterEach(() => {
    for (const p of cleanupPaths) {
      try { unlinkSync(p); } catch { /* ignore */ }
    }
    cleanupPaths.length = 0;
  });

  it("generates trial balance from entries", async () => {
    const { generateTrialBalance } = await import("@emisso/accounting");
    const path = tempPath();
    cleanupPaths.push(path);

    initLedger(path);
    const ledger = loadLedger(path);

    ledger
      .entry("Test sale")
      .date("2025-03-15")
      .debit("1.1.01.001", 1000000)
      .credit("4.1.01.001", 1000000)
      .commit();

    const entries = ledger.getEntries({});
    const tb = generateTrialBalance(ledger.chart, entries, { year: 2025, month: 3 });

    expect(tb.accounts.length).toBeGreaterThan(0);

    const totalDebit = tb.accounts.reduce((s: number, r: { debit: number }) => s + r.debit, 0);
    const totalCredit = tb.accounts.reduce((s: number, r: { credit: number }) => s + r.credit, 0);
    expect(totalDebit).toBe(totalCredit);
  });
});
