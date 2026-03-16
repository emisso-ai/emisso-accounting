import { describe, expect, it, afterEach } from "vitest";
import { existsSync, unlinkSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initLedger, initLedgerForce, loadLedger, saveLedger } from "../src/config/ledger-io";

function tempPath(): string {
  return join(tmpdir(), `test-ledger-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
}

describe("ledger-io", () => {
  const cleanupPaths: string[] = [];

  afterEach(() => {
    for (const p of cleanupPaths) {
      try { unlinkSync(p); } catch { /* ignore */ }
    }
    cleanupPaths.length = 0;
  });

  it("initLedger creates a new ledger file with SII chart", () => {
    const path = tempPath();
    cleanupPaths.push(path);

    initLedger(path);

    expect(existsSync(path)).toBe(true);
    const data = JSON.parse(readFileSync(path, "utf-8"));
    expect(data).toHaveProperty("entries");
    expect(data).toHaveProperty("config");
    expect(Array.isArray(data.entries)).toBe(true);
  });

  it("initLedger throws if file already exists", () => {
    const path = tempPath();
    cleanupPaths.push(path);

    initLedger(path);
    expect(() => initLedger(path)).toThrow("already exists");
  });

  it("initLedgerForce overwrites existing file", () => {
    const path = tempPath();
    cleanupPaths.push(path);

    initLedger(path);
    const ledger = initLedgerForce(path);
    expect(ledger).toBeDefined();
    expect(ledger.getEntries({})).toHaveLength(0);
  });

  it("loadLedger reads a valid ledger file", () => {
    const path = tempPath();
    cleanupPaths.push(path);

    initLedger(path);
    const ledger = loadLedger(path);

    expect(ledger).toBeDefined();
    expect(ledger.chart).toBeDefined();
    expect(ledger.getEntries({})).toHaveLength(0);
  });

  it("loadLedger throws on non-existent file", () => {
    expect(() => loadLedger("/tmp/does-not-exist-12345.json")).toThrow();
  });

  it("saveLedger persists entries", () => {
    const path = tempPath();
    cleanupPaths.push(path);

    initLedger(path);
    const ledger = loadLedger(path);

    // Add an entry
    ledger
      .entry("Test entry")
      .date("2025-03-15")
      .debit("1.1.01.001", 100000)
      .credit("4.1.01.001", 100000)
      .commit();

    saveLedger(path, ledger);

    // Reload and verify
    const reloaded = loadLedger(path);
    const entries = reloaded.getEntries({});
    expect(entries).toHaveLength(1);
    expect(entries[0].description).toBe("Test entry");
  });

  it("round-trips ledger data correctly", () => {
    const path = tempPath();
    cleanupPaths.push(path);

    initLedger(path, { companyRut: "76123456-0", regime: "14A" });
    const ledger = loadLedger(path);

    expect(ledger.config.companyRut).toBe("76123456-0");
    expect(ledger.config.regime).toBe("14A");
  });
});
