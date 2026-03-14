import { describe, it, expect } from "vitest";
import { fromInvoice } from "../../src/generators/from-invoice.js";
import type { InvoiceInput } from "../../src/types.js";

function sumDebits(lines: Array<{ debit: number; credit: number }>) {
  return lines.reduce((s, l) => s + l.debit, 0);
}
function sumCredits(lines: Array<{ debit: number; credit: number }>) {
  return lines.reduce((s, l) => s + l.credit, 0);
}

describe("fromInvoice — Venta", () => {
  const venta: InvoiceInput = {
    type: "venta",
    folio: 1,
    date: "2026-03-05",
    neto: 1_000_000,
    iva: 190_000,
    total: 1_190_000,
  };

  it("should generate balanced entry for venta", () => {
    const template = fromInvoice(venta);
    expect(sumDebits(template.lines)).toBe(sumCredits(template.lines));
  });

  it("should debit Clientes for total (default credit payment)", () => {
    const template = fromInvoice(venta);
    const clientesLine = template.lines.find((l) => l.accountCode === "1.1.03.001");
    expect(clientesLine).toBeDefined();
    expect(clientesLine!.debit).toBe(1_190_000);
  });

  it("should credit Ventas for neto", () => {
    const template = fromInvoice(venta);
    const ventasLine = template.lines.find((l) => l.accountCode === "4.1.01.001");
    expect(ventasLine).toBeDefined();
    expect(ventasLine!.credit).toBe(1_000_000);
  });

  it("should credit IVA DF for iva", () => {
    const template = fromInvoice(venta);
    const ivaLine = template.lines.find((l) => l.accountCode === "2.1.02.001");
    expect(ivaLine).toBeDefined();
    expect(ivaLine!.credit).toBe(190_000);
  });

  it("should route efectivo payment to Caja", () => {
    const template = fromInvoice({ ...venta, paymentMethod: "efectivo" });
    const cajaLine = template.lines.find((l) => l.accountCode === "1.1.01.001");
    expect(cajaLine).toBeDefined();
    expect(cajaLine!.debit).toBe(1_190_000);
  });

  it("should route banco payment to Banco", () => {
    const template = fromInvoice({ ...venta, paymentMethod: "banco" });
    const bancoLine = template.lines.find((l) => l.accountCode === "1.1.02.001");
    expect(bancoLine).toBeDefined();
    expect(bancoLine!.debit).toBe(1_190_000);
  });

  it("should route credito payment to Clientes", () => {
    const template = fromInvoice({ ...venta, paymentMethod: "credito" });
    const clientesLine = template.lines.find((l) => l.accountCode === "1.1.03.001");
    expect(clientesLine).toBeDefined();
    expect(clientesLine!.debit).toBe(1_190_000);
  });

  it("should include metadata with folio and type", () => {
    const template = fromInvoice(venta);
    expect(template.metadata.type).toBe("venta");
    expect(template.metadata.folio).toBe(1);
    expect(template.description).toContain("Venta");
    expect(template.description).toContain("1");
  });
});

describe("fromInvoice — Compra", () => {
  const compra: InvoiceInput = {
    type: "compra",
    folio: 100,
    date: "2026-03-10",
    neto: 500_000,
    iva: 95_000,
    total: 595_000,
  };

  it("should generate balanced entry for compra", () => {
    const template = fromInvoice(compra);
    expect(sumDebits(template.lines)).toBe(sumCredits(template.lines));
  });

  it("should debit Costo Mercaderias for neto", () => {
    const template = fromInvoice(compra);
    const costoLine = template.lines.find((l) => l.accountCode === "4.2.01.001");
    expect(costoLine).toBeDefined();
    expect(costoLine!.debit).toBe(500_000);
  });

  it("should debit IVA CF for iva", () => {
    const template = fromInvoice(compra);
    const ivaLine = template.lines.find((l) => l.accountCode === "1.1.06.001");
    expect(ivaLine).toBeDefined();
    expect(ivaLine!.debit).toBe(95_000);
  });

  it("should credit Proveedores for total (default credit payment)", () => {
    const template = fromInvoice(compra);
    const provLine = template.lines.find((l) => l.accountCode === "2.1.01.001");
    expect(provLine).toBeDefined();
    expect(provLine!.credit).toBe(595_000);
  });

  it("should route efectivo payment to Caja", () => {
    const template = fromInvoice({ ...compra, paymentMethod: "efectivo" });
    const cajaLine = template.lines.find((l) => l.accountCode === "1.1.01.001");
    expect(cajaLine).toBeDefined();
    expect(cajaLine!.credit).toBe(595_000);
  });

  it("should route banco payment to Banco", () => {
    const template = fromInvoice({ ...compra, paymentMethod: "banco" });
    const bancoLine = template.lines.find((l) => l.accountCode === "1.1.02.001");
    expect(bancoLine).toBeDefined();
    expect(bancoLine!.credit).toBe(595_000);
  });

  it("should include metadata with folio and type", () => {
    const template = fromInvoice(compra);
    expect(template.metadata.type).toBe("compra");
    expect(template.metadata.folio).toBe(100);
    expect(template.description).toContain("Compra");
  });
});
