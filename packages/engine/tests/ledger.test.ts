import { describe, it, expect } from "vitest";
import { createSiiChart } from "../src/accounts/sii-chart.js";
import { createLedger } from "../src/ledger/ledger.js";

/**
 * Realistic Chilean business scenario for March 2026:
 *
 * 1. Factura venta: neto $1,000,000 + IVA $190,000 = $1,190,000 (credit sale)
 * 2. Factura compra: neto $500,000 + IVA $95,000 = $595,000 (credit purchase)
 * 3. Payroll: sueldo bruto $800,000 (simplified — all to sueldos por pagar)
 * 4. Customer payment: receive $1,190,000 in bank
 */

function createTestLedger() {
  const chart = createSiiChart();
  const ledger = createLedger({ chart });

  // 1. Factura venta — credit sale
  // Debit: Clientes 1,190,000
  // Credit: Ventas 1,000,000
  // Credit: IVA DF 190,000
  ledger
    .entry("Factura venta #001")
    .date("2026-03-05")
    .debit("1.1.03.001", 1_190_000) // Clientes Nacionales
    .credit("4.1.01.001", 1_000_000) // Ventas Nacionales
    .credit("2.1.02.001", 190_000) // IVA Debito Fiscal
    .meta({ folio: 1, type: "factura_venta" })
    .commit();

  // 2. Factura compra — credit purchase of supplies
  // Debit: Costo Mercaderias 500,000
  // Debit: IVA CF 95,000
  // Credit: Proveedores 595,000
  ledger
    .entry("Factura compra #100")
    .date("2026-03-10")
    .debit("4.2.01.001", 500_000) // Costo Mercaderias Vendidas
    .debit("1.1.06.001", 95_000) // IVA Credito Fiscal
    .credit("2.1.01.001", 595_000) // Proveedores Nacionales
    .meta({ folio: 100, type: "factura_compra" })
    .commit();

  // 3. Payroll — simplified
  // Debit: Sueldos y Salarios 800,000
  // Credit: Sueldos por Pagar 800,000
  ledger
    .entry("Remuneraciones Marzo 2026")
    .date("2026-03-28")
    .debit("4.3.01.001", 800_000) // Sueldos y Salarios
    .credit("2.1.06.001", 800_000) // Sueldos por Pagar
    .meta({ period: "2026-03", type: "nomina" })
    .commit();

  // 4. Customer payment — receive cash in bank
  // Debit: Banco 1,190,000
  // Credit: Clientes 1,190,000
  ledger
    .entry("Cobro factura #001")
    .date("2026-03-20")
    .debit("1.1.02.001", 1_190_000) // Banco
    .credit("1.1.03.001", 1_190_000) // Clientes Nacionales
    .meta({ folio: 1, type: "cobro" })
    .commit();

  return ledger;
}

describe("Ledger — Chilean Business Scenario", () => {
  it("should create ledger with SII chart", () => {
    const chart = createSiiChart();
    const ledger = createLedger({ chart });
    expect(ledger.chart).toBe(chart);
    expect(ledger.config.currency).toBe("CLP");
  });

  it("should record all four entries", () => {
    const ledger = createTestLedger();
    const entries = ledger.getEntries();
    expect(entries).toHaveLength(4);
  });

  describe("Individual account balances", () => {
    it("should have correct Banco balance ($1,190,000)", () => {
      const ledger = createTestLedger();
      // Banco: debit 1,190,000 (payment received)
      expect(ledger.balance("1.1.02.001")).toBe(1_190_000);
    });

    it("should have zero Clientes balance (fully collected)", () => {
      const ledger = createTestLedger();
      // Clientes: debit 1,190,000 (sale) - credit 1,190,000 (collection) = 0
      expect(ledger.balance("1.1.03.001")).toBe(0);
    });

    it("should have correct IVA CF balance ($95,000)", () => {
      const ledger = createTestLedger();
      expect(ledger.balance("1.1.06.001")).toBe(95_000);
    });

    it("should have correct IVA DF balance ($190,000)", () => {
      const ledger = createTestLedger();
      // IVA DF is liability, normal balance = credit
      expect(ledger.balance("2.1.02.001")).toBe(190_000);
    });

    it("should have correct Proveedores balance ($595,000)", () => {
      const ledger = createTestLedger();
      expect(ledger.balance("2.1.01.001")).toBe(595_000);
    });

    it("should have correct Ventas balance ($1,000,000)", () => {
      const ledger = createTestLedger();
      expect(ledger.balance("4.1.01.001")).toBe(1_000_000);
    });

    it("should have correct Costo Mercaderias balance ($500,000)", () => {
      const ledger = createTestLedger();
      expect(ledger.balance("4.2.01.001")).toBe(500_000);
    });

    it("should have correct Sueldos balance ($800,000)", () => {
      const ledger = createTestLedger();
      expect(ledger.balance("4.3.01.001")).toBe(800_000);
    });

    it("should have correct Sueldos por Pagar balance ($800,000)", () => {
      const ledger = createTestLedger();
      expect(ledger.balance("2.1.06.001")).toBe(800_000);
    });
  });

  describe("Void entry", () => {
    it("should void an entry and create a reverse entry", () => {
      const ledger = createTestLedger();
      const entries = ledger.getEntries();
      const saleEntry = entries.find((e) => e.description === "Factura venta #001")!;

      const voidEntry = ledger.void(saleEntry.id, "Factura anulada");

      expect(voidEntry.voidsEntry).toBe(saleEntry.id);
      expect(voidEntry.description).toContain("ANULACION");

      // Re-fetch the original entry to check the immutable update
      const updatedOriginal = ledger.getEntries().find((e) => e.id === saleEntry.id)!;
      expect(updatedOriginal.voidedBy).toBe(voidEntry.id);

      // After voiding the sale, Ventas should be 0
      expect(ledger.balance("4.1.01.001")).toBe(0);
      // IVA DF should be 0
      expect(ledger.balance("2.1.02.001")).toBe(0);
    });

    it("should reject voiding an already voided entry", () => {
      const ledger = createTestLedger();
      const entries = ledger.getEntries();
      const saleEntry = entries[0]!;
      ledger.void(saleEntry.id, "First void");

      expect(() => ledger.void(saleEntry.id, "Second void")).toThrow("already voided");
    });

    it("should reject voiding non-existent entry", () => {
      const ledger = createTestLedger();
      expect(() =>
        ledger.void("00000000-0000-0000-0000-000000000000", "No such entry"),
      ).toThrow("Entry not found");
    });
  });

  describe("Date range queries", () => {
    it("should filter entries by date range", () => {
      const ledger = createTestLedger();

      const firstHalf = ledger.getEntries({ from: "2026-03-01", to: "2026-03-15" });
      // Sale (Mar 5) + Purchase (Mar 10) = 2 entries
      expect(firstHalf).toHaveLength(2);

      const secondHalf = ledger.getEntries({ from: "2026-03-16", to: "2026-03-31" });
      // Collection (Mar 20) + Payroll (Mar 28) = 2 entries
      expect(secondHalf).toHaveLength(2);
    });

    it("should filter entries by account code", () => {
      const ledger = createTestLedger();
      const bancoEntries = ledger.getEntries({ accountCode: "1.1.02.001" });
      // Only the collection entry touches Banco
      expect(bancoEntries).toHaveLength(1);
      expect(bancoEntries[0]!.description).toBe("Cobro factura #001");
    });

    it("should combine date and account filters", () => {
      const ledger = createTestLedger();
      const entries = ledger.getEntries({
        from: "2026-03-01",
        to: "2026-03-10",
        accountCode: "4.2.01.001",
      });
      expect(entries).toHaveLength(1); // Purchase on Mar 10
    });

    it("should compute balance with date range", () => {
      const ledger = createTestLedger();
      // Before the collection (Mar 20), Clientes should still have 1,190,000
      const balance = ledger.balance("1.1.03.001", {
        from: "2026-03-01",
        to: "2026-03-15",
      });
      expect(balance).toBe(1_190_000);
    });
  });

  describe("Serialization", () => {
    it("should serialize to JSON with config and entries", () => {
      const ledger = createTestLedger();
      const json = ledger.toJSON();

      expect(json.config).toBeDefined();
      expect(json.config.currency).toBe("CLP");
      expect(json.entries).toHaveLength(4);

      // Verify entries have all required fields
      for (const entry of json.entries) {
        expect(entry.id).toBeDefined();
        expect(entry.date).toBeDefined();
        expect(entry.description).toBeDefined();
        expect(entry.lines.length).toBeGreaterThanOrEqual(2);
        expect(entry.createdAt).toBeDefined();
      }
    });

    it("should be rehydratable from JSON", () => {
      const original = createTestLedger();
      const json = original.toJSON();

      const chart = createSiiChart();
      const restored = createLedger({
        chart,
        config: json.config,
        entries: json.entries,
      });

      expect(restored.getEntries()).toHaveLength(4);
      expect(restored.balance("1.1.02.001")).toBe(1_190_000);
      expect(restored.balance("4.1.01.001")).toBe(1_000_000);
    });
  });

  describe("Period enforcement", () => {
    it("should reject entries on closed periods", () => {
      const chart = createSiiChart();
      const ledger = createLedger({ chart });

      ledger.periods.closePeriod(2026, 3);

      expect(() =>
        ledger
          .entry("Should fail")
          .date("2026-03-15")
          .debit("1.1.01.001", 100_000)
          .credit("4.1.01.001", 100_000)
          .commit(),
      ).toThrow("period is not open");
    });
  });

  describe("accountBalance", () => {
    it("should return full AccountBalance object", () => {
      const ledger = createTestLedger();
      const ab = ledger.accountBalance("1.1.02.001");
      expect(ab.accountCode).toBe("1.1.02.001");
      expect(ab.accountName).toBe("Banco Cuenta Corriente");
      expect(ab.debit).toBe(1_190_000);
      expect(ab.credit).toBe(0);
      expect(ab.balance).toBe(1_190_000);
    });
  });

  describe("importEntries", () => {
    it("should bulk import entries", () => {
      const chart = createSiiChart();
      const ledger = createLedger({ chart });

      const original = createTestLedger();
      const json = original.toJSON();

      ledger.importEntries(json.entries);
      expect(ledger.getEntries()).toHaveLength(4);
    });
  });
});
