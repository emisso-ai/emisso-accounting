import { describe, it, expect } from "vitest";
import { createSiiChart } from "../../src/accounts/sii-chart.js";
import { createLedger } from "../../src/ledger/ledger.js";

/**
 * Same Chilean business scenario as ledger.test.ts:
 *
 * 1. Factura venta: Clientes 1,190,000 / Ventas 1,000,000 + IVA DF 190,000
 * 2. Factura compra: Costo 500,000 + IVA CF 95,000 / Proveedores 595,000
 * 3. Payroll: Sueldos 800,000 / Sueldos por Pagar 800,000
 * 4. Collection: Banco 1,190,000 / Clientes 1,190,000
 *
 * Hand-verified totals for March 2026:
 *
 * Account              | Debit       | Credit      | Balance (normal)
 * ---------------------|-------------|-------------|------------------
 * 1.1.02.001 Banco     | 1,190,000   |           0 | 1,190,000 (D)
 * 1.1.03.001 Clientes  | 1,190,000   | 1,190,000   |         0 (D)
 * 1.1.06.001 IVA CF    |    95,000   |           0 |    95,000 (D)
 * 2.1.01.001 Proveed.  |           0 |   595,000   |   595,000 (C)
 * 2.1.02.001 IVA DF    |           0 |   190,000   |   190,000 (C)
 * 2.1.06.001 Sueldos PP|           0 |   800,000   |   800,000 (C)
 * 4.1.01.001 Ventas    |           0 | 1,000,000   | 1,000,000 (C)
 * 4.2.01.001 Costo MV  |   500,000   |           0 |   500,000 (D)
 * 4.3.01.001 Sueldos   |   800,000   |           0 |   800,000 (D)
 * ---------------------|-------------|-------------|------------------
 * TOTALS               | 3,775,000   | 3,775,000   |
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

describe("Trial Balance", () => {
  it("should be balanced (totalDebits === totalCredits)", () => {
    const ledger = createTestLedger();
    const tb = ledger.trialBalance({ year: 2026, month: 3 });

    expect(tb.isBalanced).toBe(true);
    expect(tb.totalDebits).toBe(tb.totalCredits);
  });

  it("should have correct total debits and credits ($3,775,000)", () => {
    const ledger = createTestLedger();
    const tb = ledger.trialBalance({ year: 2026, month: 3 });

    expect(tb.totalDebits).toBe(3_775_000);
    expect(tb.totalCredits).toBe(3_775_000);
  });

  it("should have correct period", () => {
    const ledger = createTestLedger();
    const tb = ledger.trialBalance({ year: 2026, month: 3 });

    expect(tb.period.year).toBe(2026);
    expect(tb.period.month).toBe(3);
  });

  it("should include all accounts that had movement", () => {
    const ledger = createTestLedger();
    const tb = ledger.trialBalance({ year: 2026, month: 3 });

    // 9 accounts had movement (Clientes had both debit and credit but net 0)
    const codes = tb.accounts.map((a) => a.accountCode);
    expect(codes).toContain("1.1.02.001"); // Banco
    expect(codes).toContain("1.1.03.001"); // Clientes
    expect(codes).toContain("1.1.06.001"); // IVA CF
    expect(codes).toContain("2.1.01.001"); // Proveedores
    expect(codes).toContain("2.1.02.001"); // IVA DF
    expect(codes).toContain("2.1.06.001"); // Sueldos por Pagar
    expect(codes).toContain("4.1.01.001"); // Ventas
    expect(codes).toContain("4.2.01.001"); // Costo MV
    expect(codes).toContain("4.3.01.001"); // Sueldos
  });

  it("should have correct individual balances", () => {
    const ledger = createTestLedger();
    const tb = ledger.trialBalance({ year: 2026, month: 3 });

    const find = (code: string) => tb.accounts.find((a) => a.accountCode === code)!;

    // Assets (debit normal)
    expect(find("1.1.02.001").balance).toBe(1_190_000); // Banco
    expect(find("1.1.03.001").balance).toBe(0); // Clientes (collected)
    expect(find("1.1.06.001").balance).toBe(95_000); // IVA CF

    // Liabilities (credit normal)
    expect(find("2.1.01.001").balance).toBe(595_000); // Proveedores
    expect(find("2.1.02.001").balance).toBe(190_000); // IVA DF
    expect(find("2.1.06.001").balance).toBe(800_000); // Sueldos PP

    // Revenue (credit normal)
    expect(find("4.1.01.001").balance).toBe(1_000_000); // Ventas

    // Expenses (debit normal)
    expect(find("4.2.01.001").balance).toBe(500_000); // Costo MV
    expect(find("4.3.01.001").balance).toBe(800_000); // Sueldos
  });

  it("should have correct debit/credit movement per account", () => {
    const ledger = createTestLedger();
    const tb = ledger.trialBalance({ year: 2026, month: 3 });

    const find = (code: string) => tb.accounts.find((a) => a.accountCode === code)!;

    const banco = find("1.1.02.001");
    expect(banco.debit).toBe(1_190_000);
    expect(banco.credit).toBe(0);

    const clientes = find("1.1.03.001");
    expect(clientes.debit).toBe(1_190_000);
    expect(clientes.credit).toBe(1_190_000);

    const ventas = find("4.1.01.001");
    expect(ventas.debit).toBe(0);
    expect(ventas.credit).toBe(1_000_000);
  });

  it("should return empty trial balance for period with no entries", () => {
    const ledger = createTestLedger();
    const tb = ledger.trialBalance({ year: 2025, month: 1 });

    expect(tb.accounts).toHaveLength(0);
    expect(tb.totalDebits).toBe(0);
    expect(tb.totalCredits).toBe(0);
    expect(tb.isBalanced).toBe(true);
  });

  it("should use current period when none specified", () => {
    const chart = createSiiChart();
    const ledger = createLedger({ chart });
    const tb = ledger.trialBalance();

    expect(tb.period).toBeDefined();
    expect(tb.period.year).toBeGreaterThanOrEqual(2025);
  });
});
