import { describe, it, expect } from "vitest";
import { createSiiChart } from "../../src/accounts/sii-chart.js";
import { createLedger } from "../../src/ledger/ledger.js";
import { calculatePpm } from "../../src/tax/ppm.js";

function makeRevenueEntries(neto: number) {
  const chart = createSiiChart();
  const ledger = createLedger({ chart });
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  ledger
    .entry("Venta")
    .date("2026-03-05")
    .debit("1.1.03.001", total)
    .credit("4.1.01.001", neto)
    .credit("2.1.02.001", iva)
    .commit();

  return ledger.getEntries();
}

describe("PPM Calculation", () => {
  const period = { year: 2026, month: 3 };

  it("should calculate PPM at 14A rate (0.25%)", () => {
    // $1,000,000 revenue * 0.25% = $2,500
    const entries = makeRevenueEntries(1_000_000);
    const result = calculatePpm(entries, period, { regime: "14A" });

    expect(result.baseImponible).toBe(1_000_000);
    expect(result.rate).toBe(0.25);
    expect(result.ppmAmount).toBe(2_500);
  });

  it("should calculate PPM at 14D-N3 rate (0.125%)", () => {
    // $1,000,000 revenue * 0.125% = $1,250
    const entries = makeRevenueEntries(1_000_000);
    const result = calculatePpm(entries, period, { regime: "14D-N3" });

    expect(result.baseImponible).toBe(1_000_000);
    expect(result.rate).toBe(0.125);
    expect(result.ppmAmount).toBe(1_250);
  });

  it("should calculate PPM at 14D-N8 rate (0.25%)", () => {
    const entries = makeRevenueEntries(1_000_000);
    const result = calculatePpm(entries, period, { regime: "14D-N8" });

    expect(result.baseImponible).toBe(1_000_000);
    expect(result.rate).toBe(0.25);
    expect(result.ppmAmount).toBe(2_500);
  });

  it("should use custom rate override", () => {
    // $1,000,000 revenue * 0.5% = $5,000
    const entries = makeRevenueEntries(1_000_000);
    const result = calculatePpm(entries, period, { regime: "14A", rate: 0.5 });

    expect(result.rate).toBe(0.5);
    expect(result.ppmAmount).toBe(5_000);
  });

  it("should round PPM to integer", () => {
    // $333,333 * 0.25% = 833.3325 → rounded to 833
    const entries = makeRevenueEntries(333_333);
    const result = calculatePpm(entries, period, { regime: "14A" });

    expect(result.baseImponible).toBe(333_333);
    expect(result.ppmAmount).toBe(833);
  });

  it("should return zero PPM when no revenue entries", () => {
    const result = calculatePpm([], period, { regime: "14A" });

    expect(result.baseImponible).toBe(0);
    expect(result.ppmAmount).toBe(0);
  });
});
