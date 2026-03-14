import { describe, it, expect } from "vitest";
import { createSiiChart } from "../../src/accounts/sii-chart.js";
import { createLedger } from "../../src/ledger/ledger.js";
import { generateLibroDiarioXml } from "../../src/xml/libro-diario.js";

function makeTestEntries() {
  const chart = createSiiChart();
  const ledger = createLedger({ chart });

  ledger
    .entry("Venta factura #001")
    .date("2026-03-05")
    .debit("1.1.03.001", 1_190_000)
    .credit("4.1.01.001", 1_000_000)
    .credit("2.1.02.001", 190_000)
    .commit();

  ledger
    .entry("Compra factura #100")
    .date("2026-03-10")
    .debit("4.2.01.001", 500_000)
    .debit("1.1.06.001", 95_000)
    .credit("2.1.01.001", 595_000)
    .commit();

  return ledger.getEntries();
}

describe("Libro Diario XML", () => {
  const config = {
    rut: "76.000.000-0",
    razonSocial: "Empresa Test SpA",
    period: { year: 2026, month: 3 },
  };

  it("should start with XML declaration", () => {
    const entries = makeTestEntries();
    const xml = generateLibroDiarioXml(entries, config);
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="ISO-8859-1"\?>/);
  });

  it("should have LibroDiario root element", () => {
    const entries = makeTestEntries();
    const xml = generateLibroDiarioXml(entries, config);
    expect(xml).toContain("<LibroDiario>");
    expect(xml).toContain("</LibroDiario>");
  });

  it("should include Caratula with RUT, razon social, and period", () => {
    const entries = makeTestEntries();
    const xml = generateLibroDiarioXml(entries, config);
    expect(xml).toContain("<RutEmpresa>76.000.000-0</RutEmpresa>");
    expect(xml).toContain("<RazonSocial>Empresa Test SpA</RazonSocial>");
    expect(xml).toContain("<Periodo>2026-03</Periodo>");
  });

  it("should include TotalRegistros matching entry count", () => {
    const entries = makeTestEntries();
    const xml = generateLibroDiarioXml(entries, config);
    expect(xml).toContain("<TotalRegistros>2</TotalRegistros>");
  });

  it("should have correct number of Detalle elements", () => {
    const entries = makeTestEntries();
    const xml = generateLibroDiarioXml(entries, config);
    const detalleCount = (xml.match(/<Detalle>/g) || []).length;
    expect(detalleCount).toBe(2);
  });

  it("should include Resumen with matching totals", () => {
    const entries = makeTestEntries();
    const xml = generateLibroDiarioXml(entries, config);

    // Entry 1: debit 1,190,000; credit 1,000,000 + 190,000 = 1,190,000
    // Entry 2: debit 500,000 + 95,000 = 595,000; credit 595,000
    // Total Debe = 1,190,000 + 595,000 = 1,785,000
    // Total Haber = 1,190,000 + 595,000 = 1,785,000
    expect(xml).toContain("<TotalDebe>1785000</TotalDebe>");
    expect(xml).toContain("<TotalHaber>1785000</TotalHaber>");
  });

  it("should include resolucion when provided", () => {
    const entries = makeTestEntries();
    const xml = generateLibroDiarioXml(entries, {
      ...config,
      resolucion: { numero: 123, fecha: "2020-01-01" },
    });
    expect(xml).toContain("<NumeroResolucion>123</NumeroResolucion>");
    expect(xml).toContain("<FechaResolucion>2020-01-01</FechaResolucion>");
  });

  it("should escape XML special characters in razon social", () => {
    const entries = makeTestEntries();
    const xml = generateLibroDiarioXml(entries, {
      ...config,
      razonSocial: "Empresa & Cia <Ltda>",
    });
    expect(xml).toContain("<RazonSocial>Empresa &amp; Cia &lt;Ltda&gt;</RazonSocial>");
  });

  it("should only include entries within the period", () => {
    const chart = createSiiChart();
    const ledger = createLedger({ chart });

    ledger
      .entry("Febrero entry")
      .date("2026-02-15")
      .debit("1.1.01.001", 100_000)
      .credit("4.1.01.001", 100_000)
      .commit();

    ledger
      .entry("Marzo entry")
      .date("2026-03-15")
      .debit("1.1.01.001", 200_000)
      .credit("4.1.01.001", 200_000)
      .commit();

    const xml = generateLibroDiarioXml(ledger.getEntries(), config);
    expect(xml).toContain("<TotalRegistros>1</TotalRegistros>");
    expect(xml).toContain("Marzo entry");
    expect(xml).not.toContain("Febrero entry");
  });
});
