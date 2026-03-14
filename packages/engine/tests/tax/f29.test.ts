import { describe, it, expect } from "vitest";
import { createSiiChart } from "../../src/accounts/sii-chart.js";
import { createLedger } from "../../src/ledger/ledger.js";
import { prepareF29 } from "../../src/tax/f29.js";

function makeTestEntries() {
  const chart = createSiiChart();
  const ledger = createLedger({ chart });

  // Sale: $1,000,000 neto + $190,000 IVA = $1,190,000
  ledger
    .entry("Venta factura #001")
    .date("2026-03-05")
    .debit("1.1.03.001", 1_190_000)
    .credit("4.1.01.001", 1_000_000)
    .credit("2.1.02.001", 190_000)
    .commit();

  // Purchase: $500,000 neto + $95,000 IVA = $595,000
  ledger
    .entry("Compra factura #100")
    .date("2026-03-10")
    .debit("4.2.01.001", 500_000)
    .debit("1.1.06.001", 95_000)
    .credit("2.1.01.001", 595_000)
    .commit();

  return ledger.getEntries();
}

describe("F29 Preparation", () => {
  const period = { year: 2026, month: 3 };

  it("should combine IVA and PPM with 14A regime", () => {
    const entries = makeTestEntries();
    const f29 = prepareF29(entries, period, { regime: "14A" });

    // IVA: DF = 190,000, CF = 95,000, determinado = 95,000
    expect(f29.iva.debitoFiscal).toBe(190_000);
    expect(f29.iva.creditoFiscal).toBe(95_000);
    expect(f29.iva.ivaDeterminado).toBe(95_000);
    expect(f29.iva.ivaRemanente).toBe(0);

    // PPM: $1,000,000 * 0.25% = $2,500
    expect(f29.ppm.baseImponible).toBe(1_000_000);
    expect(f29.ppm.rate).toBe(0.25);
    expect(f29.ppm.ppmAmount).toBe(2_500);

    // Total to pay = 95,000 + 2,500 = 97,500
    expect(f29.totalToPay).toBe(97_500);
  });

  it("should apply ivaRemanenteAnterior", () => {
    const entries = makeTestEntries();
    const f29 = prepareF29(entries, period, {
      regime: "14A",
      ivaRemanenteAnterior: 50_000,
    });

    // IVA determinado = 190,000 - (95,000 + 50,000) = 45,000
    expect(f29.iva.ivaDeterminado).toBe(45_000);
    expect(f29.totalToPay).toBe(45_000 + 2_500);
  });

  it("should use 14D-N3 PPM rate", () => {
    const entries = makeTestEntries();
    const f29 = prepareF29(entries, period, { regime: "14D-N3" });

    // PPM: $1,000,000 * 0.125% = $1,250
    expect(f29.ppm.rate).toBe(0.125);
    expect(f29.ppm.ppmAmount).toBe(1_250);
    expect(f29.totalToPay).toBe(95_000 + 1_250);
  });

  it("should populate F29 field codes correctly", () => {
    const entries = makeTestEntries();
    const f29 = prepareF29(entries, period, { regime: "14A" });

    expect(f29.fields["91"]).toBe(190_000);   // Debito fiscal
    expect(f29.fields["520"]).toBe(95_000);    // Credito fiscal
    expect(f29.fields["504"]).toBe(0);         // Remanente anterior
    expect(f29.fields["89"]).toBe(95_000);     // IVA determinado
    expect(f29.fields["77"]).toBe(0);          // Remanente siguiente
    expect(f29.fields["563"]).toBe(1_000_000); // Base imponible PPM
    expect(f29.fields["115"]).toBe(2_500);     // Tasa PPM (0.25 * 10000)
    expect(f29.fields["48"]).toBe(2_500);      // PPM del periodo
    expect(f29.fields["91_total"]).toBe(97_500); // Total a pagar
  });

  it("should include period in result", () => {
    const entries = makeTestEntries();
    const f29 = prepareF29(entries, period, { regime: "14A" });

    expect(f29.period).toEqual({ year: 2026, month: 3 });
  });
});
