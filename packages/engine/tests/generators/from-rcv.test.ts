import { describe, it, expect } from "vitest";
import { fromRcv } from "../../src/generators/from-rcv.js";
import type { RcvInput } from "../../src/types.js";

function sumDebits(lines: Array<{ debit: number; credit: number }>) {
  return lines.reduce((s, l) => s + l.debit, 0);
}
function sumCredits(lines: Array<{ debit: number; credit: number }>) {
  return lines.reduce((s, l) => s + l.credit, 0);
}

describe("fromRcv — Venta", () => {
  const venta: RcvInput = {
    type: "venta",
    documentType: "33",
    folio: 456,
    date: "2026-03-15",
    rut: "12.345.678-9",
    razonSocial: "Cliente SpA",
    neto: 1_000_000,
    exento: 0,
    iva: 190_000,
    total: 1_190_000,
  };

  it("should generate balanced entry for venta", () => {
    const template = fromRcv(venta);
    expect(sumDebits(template.lines)).toBe(sumCredits(template.lines));
  });

  it("should debit Clientes for total", () => {
    const template = fromRcv(venta);
    const clientesLine = template.lines.find((l) => l.accountCode === "1.1.03.001");
    expect(clientesLine).toBeDefined();
    expect(clientesLine!.debit).toBe(1_190_000);
  });

  it("should credit Ventas for neto", () => {
    const template = fromRcv(venta);
    const ventasLines = template.lines.filter((l) => l.accountCode === "4.1.01.001");
    expect(ventasLines).toHaveLength(1);
    expect(ventasLines[0]!.credit).toBe(1_000_000);
  });

  it("should credit IVA DF for iva", () => {
    const template = fromRcv(venta);
    const ivaLine = template.lines.find((l) => l.accountCode === "2.1.02.001");
    expect(ivaLine).toBeDefined();
    expect(ivaLine!.credit).toBe(190_000);
  });

  it("should handle exento amount as additional Ventas credit", () => {
    const ventaExenta: RcvInput = {
      ...venta,
      neto: 500_000,
      exento: 200_000,
      iva: 95_000,
      total: 795_000,
    };
    const template = fromRcv(ventaExenta);

    // Two ventas credits: one for neto, one for exento
    const ventasLines = template.lines.filter((l) => l.accountCode === "4.1.01.001");
    expect(ventasLines).toHaveLength(2);
    const totalVentas = ventasLines.reduce((s, l) => s + l.credit, 0);
    expect(totalVentas).toBe(700_000); // 500,000 + 200,000

    expect(sumDebits(template.lines)).toBe(sumCredits(template.lines));
  });

  it("should include RCV metadata", () => {
    const template = fromRcv(venta);
    expect(template.metadata.source).toBe("rcv");
    expect(template.metadata.type).toBe("venta");
    expect(template.metadata.documentType).toBe("33");
    expect(template.metadata.folio).toBe(456);
    expect(template.metadata.rut).toBe("12.345.678-9");
    expect(template.description).toContain("RCV Venta");
    expect(template.description).toContain("456");
  });
});

describe("fromRcv — Compra", () => {
  const compra: RcvInput = {
    type: "compra",
    documentType: "33",
    folio: 789,
    date: "2026-03-20",
    rut: "98.765.432-1",
    razonSocial: "Proveedor Ltda",
    neto: 500_000,
    exento: 0,
    iva: 95_000,
    total: 595_000,
  };

  it("should generate balanced entry for compra", () => {
    const template = fromRcv(compra);
    expect(sumDebits(template.lines)).toBe(sumCredits(template.lines));
  });

  it("should debit Costo Mercaderias for neto", () => {
    const template = fromRcv(compra);
    const costoLines = template.lines.filter((l) => l.accountCode === "4.2.01.001");
    expect(costoLines).toHaveLength(1);
    expect(costoLines[0]!.debit).toBe(500_000);
  });

  it("should debit IVA CF for iva", () => {
    const template = fromRcv(compra);
    const ivaLine = template.lines.find((l) => l.accountCode === "1.1.06.001");
    expect(ivaLine).toBeDefined();
    expect(ivaLine!.debit).toBe(95_000);
  });

  it("should credit Proveedores for total", () => {
    const template = fromRcv(compra);
    const provLine = template.lines.find((l) => l.accountCode === "2.1.01.001");
    expect(provLine).toBeDefined();
    expect(provLine!.credit).toBe(595_000);
  });

  it("should handle exento amount as additional Costo debit", () => {
    const compraExenta: RcvInput = {
      ...compra,
      neto: 300_000,
      exento: 100_000,
      iva: 57_000,
      total: 457_000,
    };
    const template = fromRcv(compraExenta);

    const costoLines = template.lines.filter((l) => l.accountCode === "4.2.01.001");
    expect(costoLines).toHaveLength(2);
    const totalCosto = costoLines.reduce((s, l) => s + l.debit, 0);
    expect(totalCosto).toBe(400_000); // 300,000 + 100,000

    expect(sumDebits(template.lines)).toBe(sumCredits(template.lines));
  });

  it("should include RCV metadata for compra", () => {
    const template = fromRcv(compra);
    expect(template.metadata.source).toBe("rcv");
    expect(template.metadata.type).toBe("compra");
    expect(template.description).toContain("RCV Compra");
    expect(template.description).toContain("Proveedor Ltda");
  });
});
