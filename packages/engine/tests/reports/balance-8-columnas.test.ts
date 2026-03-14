import { describe, it, expect } from "vitest";
import { createSiiChart } from "../../src/accounts/sii-chart.js";
import { createLedger } from "../../src/ledger/ledger.js";

/**
 * Same Chilean business scenario:
 *
 * 1. Factura venta: Clientes 1,190,000 / Ventas 1,000,000 + IVA DF 190,000
 * 2. Factura compra: Costo 500,000 + IVA CF 95,000 / Proveedores 595,000
 * 3. Payroll: Sueldos 800,000 / Sueldos por Pagar 800,000
 * 4. Collection: Banco 1,190,000 / Clientes 1,190,000
 *
 * Balance de 8 Columnas (hand-verified):
 *
 * Account              | D.Mov       | C.Mov       | D.Bal       | C.Bal       | Activo      | Pasivo      | Perdida     | Ganancia
 * ---------------------|-------------|-------------|-------------|-------------|-------------|-------------|-------------|----------
 * 1.1.02.001 Banco     | 1,190,000   |           0 | 1,190,000   |           0 | 1,190,000   |           0 |           0 |          0
 * 1.1.03.001 Clientes  | 1,190,000   | 1,190,000   |           0 |           0 |           0 |           0 |           0 |          0
 * 1.1.06.001 IVA CF    |    95,000   |           0 |    95,000   |           0 |    95,000   |           0 |           0 |          0
 * 2.1.01.001 Proveed.  |           0 |   595,000   |           0 |   595,000   |           0 |   595,000   |           0 |          0
 * 2.1.02.001 IVA DF    |           0 |   190,000   |           0 |   190,000   |           0 |   190,000   |           0 |          0
 * 2.1.06.001 Sueldos PP|           0 |   800,000   |           0 |   800,000   |           0 |   800,000   |           0 |          0
 * 4.1.01.001 Ventas    |           0 | 1,000,000   |           0 | 1,000,000   |           0 |           0 |           0 | 1,000,000
 * 4.2.01.001 Costo MV  |   500,000   |           0 |   500,000   |           0 |           0 |           0 |   500,000   |          0
 * 4.3.01.001 Sueldos   |   800,000   |           0 |   800,000   |           0 |           0 |           0 |   800,000   |          0
 * ---------------------|-------------|-------------|-------------|-------------|-------------|-------------|-------------|----------
 * TOTALS               | 3,775,000   | 3,775,000   | 2,585,000   | 2,585,000   | 1,285,000   | 1,585,000   | 1,300,000   | 1,000,000
 */

function createTestLedger() {
  const chart = createSiiChart();
  const ledger = createLedger({ chart });

  ledger
    .entry("Factura venta #001")
    .date("2026-03-05")
    .debit("1.1.03.001", 1_190_000)
    .credit("4.1.01.001", 1_000_000)
    .credit("2.1.02.001", 190_000)
    .commit();

  ledger
    .entry("Factura compra #100")
    .date("2026-03-10")
    .debit("4.2.01.001", 500_000)
    .debit("1.1.06.001", 95_000)
    .credit("2.1.01.001", 595_000)
    .commit();

  ledger
    .entry("Remuneraciones Marzo 2026")
    .date("2026-03-28")
    .debit("4.3.01.001", 800_000)
    .credit("2.1.06.001", 800_000)
    .commit();

  ledger
    .entry("Cobro factura #001")
    .date("2026-03-20")
    .debit("1.1.02.001", 1_190_000)
    .credit("1.1.03.001", 1_190_000)
    .commit();

  return ledger;
}

describe("Balance de 8 Columnas", () => {
  it("should have correct period", () => {
    const ledger = createTestLedger();
    const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });
    expect(b8.period.year).toBe(2026);
    expect(b8.period.month).toBe(3);
  });

  it("should include all accounts with movement", () => {
    const ledger = createTestLedger();
    const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });
    expect(b8.rows).toHaveLength(9);
  });

  describe("Movement columns (debitMovement / creditMovement)", () => {
    it("should have correct total movements", () => {
      const ledger = createTestLedger();
      const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });

      expect(b8.totals.debitMovement).toBe(3_775_000);
      expect(b8.totals.creditMovement).toBe(3_775_000);
    });
  });

  describe("Balance columns (debitBalance / creditBalance)", () => {
    it("should have correct total balances", () => {
      const ledger = createTestLedger();
      const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });

      expect(b8.totals.debitBalance).toBe(2_585_000);
      expect(b8.totals.creditBalance).toBe(2_585_000);
    });
  });

  describe("Classification columns", () => {
    it("asset with debit balance goes to activo", () => {
      const ledger = createTestLedger();
      const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });

      const banco = b8.rows.find((r) => r.accountCode === "1.1.02.001")!;
      expect(banco.activo).toBe(1_190_000);
      expect(banco.pasivo).toBe(0);
      expect(banco.perdida).toBe(0);
      expect(banco.ganancia).toBe(0);

      const ivaCF = b8.rows.find((r) => r.accountCode === "1.1.06.001")!;
      expect(ivaCF.activo).toBe(95_000);
    });

    it("liability with credit balance goes to pasivo", () => {
      const ledger = createTestLedger();
      const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });

      const proveedores = b8.rows.find((r) => r.accountCode === "2.1.01.001")!;
      expect(proveedores.pasivo).toBe(595_000);
      expect(proveedores.activo).toBe(0);
      expect(proveedores.perdida).toBe(0);
      expect(proveedores.ganancia).toBe(0);

      const ivaDF = b8.rows.find((r) => r.accountCode === "2.1.02.001")!;
      expect(ivaDF.pasivo).toBe(190_000);

      const sueldosPP = b8.rows.find((r) => r.accountCode === "2.1.06.001")!;
      expect(sueldosPP.pasivo).toBe(800_000);
    });

    it("expense with debit balance goes to perdida", () => {
      const ledger = createTestLedger();
      const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });

      const costoMV = b8.rows.find((r) => r.accountCode === "4.2.01.001")!;
      expect(costoMV.perdida).toBe(500_000);
      expect(costoMV.activo).toBe(0);
      expect(costoMV.pasivo).toBe(0);
      expect(costoMV.ganancia).toBe(0);

      const sueldos = b8.rows.find((r) => r.accountCode === "4.3.01.001")!;
      expect(sueldos.perdida).toBe(800_000);
    });

    it("revenue with credit balance goes to ganancia", () => {
      const ledger = createTestLedger();
      const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });

      const ventas = b8.rows.find((r) => r.accountCode === "4.1.01.001")!;
      expect(ventas.ganancia).toBe(1_000_000);
      expect(ventas.activo).toBe(0);
      expect(ventas.pasivo).toBe(0);
      expect(ventas.perdida).toBe(0);
    });
  });

  describe("Classification totals", () => {
    it("should have correct activo total ($1,285,000)", () => {
      const ledger = createTestLedger();
      const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });
      // Banco 1,190,000 + IVA CF 95,000 = 1,285,000
      expect(b8.totals.activo).toBe(1_285_000);
    });

    it("should have correct pasivo total ($1,585,000)", () => {
      const ledger = createTestLedger();
      const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });
      // Proveedores 595,000 + IVA DF 190,000 + Sueldos PP 800,000 = 1,585,000
      expect(b8.totals.pasivo).toBe(1_585_000);
    });

    it("should have correct perdida total ($1,300,000)", () => {
      const ledger = createTestLedger();
      const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });
      // Costo MV 500,000 + Sueldos 800,000 = 1,300,000
      expect(b8.totals.perdida).toBe(1_300_000);
    });

    it("should have correct ganancia total ($1,000,000)", () => {
      const ledger = createTestLedger();
      const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });
      // Ventas 1,000,000
      expect(b8.totals.ganancia).toBe(1_000_000);
    });

    it("should satisfy: activo + perdida === pasivo + ganancia", () => {
      const ledger = createTestLedger();
      const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });
      // 1,285,000 + 1,300,000 = 2,585,000
      // 1,585,000 + 1,000,000 = 2,585,000
      expect(b8.totals.activo + b8.totals.perdida).toBe(
        b8.totals.pasivo + b8.totals.ganancia,
      );
    });
  });

  describe("Zero-balance accounts", () => {
    it("should show zero in classification columns for accounts with zero balance", () => {
      const ledger = createTestLedger();
      const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });

      // Clientes has debit 1,190,000 and credit 1,190,000 — net zero
      const clientes = b8.rows.find((r) => r.accountCode === "1.1.03.001")!;
      expect(clientes.debitMovement).toBe(1_190_000);
      expect(clientes.creditMovement).toBe(1_190_000);
      expect(clientes.debitBalance).toBe(0);
      expect(clientes.creditBalance).toBe(0);
      expect(clientes.activo).toBe(0);
      expect(clientes.pasivo).toBe(0);
    });
  });

  it("should return empty report for period with no entries", () => {
    const ledger = createTestLedger();
    const b8 = ledger.balance8Columnas({ year: 2025, month: 1 });
    expect(b8.rows).toHaveLength(0);
    expect(b8.totals.debitMovement).toBe(0);
  });
});
