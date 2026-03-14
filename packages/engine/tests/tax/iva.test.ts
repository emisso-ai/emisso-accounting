import { describe, it, expect } from "vitest";
import { createSiiChart } from "../../src/accounts/sii-chart.js";
import { createLedger } from "../../src/ledger/ledger.js";
import { calculateIva } from "../../src/tax/iva.js";

function makeEntries(
  sales: { neto: number; iva: number }[],
  purchases: { neto: number; iva: number }[],
) {
  const chart = createSiiChart();
  const ledger = createLedger({ chart });

  for (const s of sales) {
    const total = s.neto + s.iva;
    ledger
      .entry("Venta")
      .date("2026-03-05")
      .debit("1.1.03.001", total)
      .credit("4.1.01.001", s.neto)
      .credit("2.1.02.001", s.iva)
      .commit();
  }

  for (const p of purchases) {
    const total = p.neto + p.iva;
    ledger
      .entry("Compra")
      .date("2026-03-10")
      .debit("4.2.01.001", p.neto)
      .debit("1.1.06.001", p.iva)
      .credit("2.1.01.001", total)
      .commit();
  }

  return ledger.getEntries();
}

describe("IVA Calculation", () => {
  const period = { year: 2026, month: 3 };

  it("should compute IVA determinado when DF > CF", () => {
    // Sell $1,000,000 neto → IVA DF = $190,000
    // Buy  $500,000 neto  → IVA CF = $95,000
    // IVA determinado = 190,000 - 95,000 = $95,000
    const entries = makeEntries(
      [{ neto: 1_000_000, iva: 190_000 }],
      [{ neto: 500_000, iva: 95_000 }],
    );

    const result = calculateIva(entries, period);

    expect(result.debitoFiscal).toBe(190_000);
    expect(result.creditoFiscal).toBe(95_000);
    expect(result.ivaRemanenteAnterior).toBe(0);
    expect(result.ivaDeterminado).toBe(95_000);
    expect(result.ivaRemanente).toBe(0);
  });

  it("should apply remanente anterior to reduce IVA determinado", () => {
    // DF = 190,000, CF = 95,000, remanente anterior = 50,000
    // Total CF = 95,000 + 50,000 = 145,000
    // IVA determinado = 190,000 - 145,000 = 45,000
    const entries = makeEntries(
      [{ neto: 1_000_000, iva: 190_000 }],
      [{ neto: 500_000, iva: 95_000 }],
    );

    const result = calculateIva(entries, period, { ivaRemanenteAnterior: 50_000 });

    expect(result.debitoFiscal).toBe(190_000);
    expect(result.creditoFiscal).toBe(95_000);
    expect(result.ivaRemanenteAnterior).toBe(50_000);
    expect(result.ivaDeterminado).toBe(45_000);
    expect(result.ivaRemanente).toBe(0);
  });

  it("should create remanente when CF > DF", () => {
    // Sell $200,000 neto → IVA DF = $38,000
    // Buy $500,000 neto  → IVA CF = $95,000
    // IVA determinado = 38,000 - 95,000 = -57,000 → clamped to 0
    // Remanente = 57,000
    const entries = makeEntries(
      [{ neto: 200_000, iva: 38_000 }],
      [{ neto: 500_000, iva: 95_000 }],
    );

    const result = calculateIva(entries, period);

    expect(result.debitoFiscal).toBe(38_000);
    expect(result.creditoFiscal).toBe(95_000);
    expect(result.ivaDeterminado).toBe(0);
    expect(result.ivaRemanente).toBe(57_000);
  });

  it("should create larger remanente when previous remanente plus CF exceeds DF", () => {
    // DF = 190,000, CF = 95,000, remanente anterior = 200,000
    // Total CF = 95,000 + 200,000 = 295,000
    // ivaDeterminado = 190,000 - 295,000 = -105,000 → 0
    // Remanente = 105,000
    const entries = makeEntries(
      [{ neto: 1_000_000, iva: 190_000 }],
      [{ neto: 500_000, iva: 95_000 }],
    );

    const result = calculateIva(entries, period, { ivaRemanenteAnterior: 200_000 });

    expect(result.ivaDeterminado).toBe(0);
    expect(result.ivaRemanente).toBe(105_000);
  });

  it("should return zero for all fields when no entries exist", () => {
    const result = calculateIva([], period);

    expect(result.debitoFiscal).toBe(0);
    expect(result.creditoFiscal).toBe(0);
    expect(result.ivaDeterminado).toBe(0);
    expect(result.ivaRemanente).toBe(0);
  });
});
