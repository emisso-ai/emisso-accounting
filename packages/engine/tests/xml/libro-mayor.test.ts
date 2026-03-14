import { describe, it, expect } from "vitest";
import { createSiiChart } from "../../src/accounts/sii-chart.js";
import { createLedger } from "../../src/ledger/ledger.js";
import { generateLibroMayorXml } from "../../src/xml/libro-mayor.js";

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

  return { entries: ledger.getEntries(), chart };
}

describe("Libro Mayor XML", () => {
  const xmlConfig = {
    rut: "76.000.000-0",
    razonSocial: "Empresa Test SpA",
    period: { year: 2026, month: 3 },
  };

  it("should start with XML declaration", () => {
    const { entries, chart } = makeTestEntries();
    const xml = generateLibroMayorXml(chart, entries, xmlConfig);
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="ISO-8859-1"\?>/);
  });

  it("should have LibroMayor root element", () => {
    const { entries, chart } = makeTestEntries();
    const xml = generateLibroMayorXml(chart, entries, xmlConfig);
    expect(xml).toContain("<LibroMayor>");
    expect(xml).toContain("</LibroMayor>");
  });

  it("should include Caratula with RUT and period", () => {
    const { entries, chart } = makeTestEntries();
    const xml = generateLibroMayorXml(chart, entries, xmlConfig);
    expect(xml).toContain("<RutEmpresa>76.000.000-0</RutEmpresa>");
    expect(xml).toContain("<Periodo>2026-03</Periodo>");
  });

  it("should report correct TotalCuentas", () => {
    const { entries, chart } = makeTestEntries();
    const xml = generateLibroMayorXml(chart, entries, xmlConfig);

    // Accounts used: 1.1.03.001, 4.1.01.001, 2.1.02.001, 4.2.01.001, 1.1.06.001, 2.1.01.001
    // = 6 unique accounts
    expect(xml).toContain("<TotalCuentas>6</TotalCuentas>");
  });

  it("should have one Cuenta element per unique account", () => {
    const { entries, chart } = makeTestEntries();
    const xml = generateLibroMayorXml(chart, entries, xmlConfig);
    const cuentaCount = (xml.match(/<Cuenta>/g) || []).length;
    expect(cuentaCount).toBe(6);
  });

  it("should include account names from the chart", () => {
    const { entries, chart } = makeTestEntries();
    const xml = generateLibroMayorXml(chart, entries, xmlConfig);
    expect(xml).toContain("<NombreCuenta>Clientes Nacionales</NombreCuenta>");
    expect(xml).toContain("<NombreCuenta>Ventas Nacionales</NombreCuenta>");
    expect(xml).toContain("<NombreCuenta>IVA Debito Fiscal</NombreCuenta>");
  });

  it("should include Movimiento elements with dates and amounts", () => {
    const { entries, chart } = makeTestEntries();
    const xml = generateLibroMayorXml(chart, entries, xmlConfig);
    expect(xml).toContain("<Fecha>2026-03-05</Fecha>");
    expect(xml).toContain("<MontoDebe>1190000</MontoDebe>");
    expect(xml).toContain("<MontoHaber>1000000</MontoHaber>");
  });

  it("should include SaldoDeudor and SaldoAcreedor per account", () => {
    const { entries, chart } = makeTestEntries();
    const xml = generateLibroMayorXml(chart, entries, xmlConfig);
    expect(xml).toContain("<SaldoDeudor>");
    expect(xml).toContain("<SaldoAcreedor>");
  });
});
