import { describe, it, expect } from "vitest";
import type { Balance8Columnas } from "../../src/types.js";
import { generateBalanceXml } from "../../src/xml/balance.js";

function makeTestBalance(): Balance8Columnas {
  return {
    period: { year: 2026, month: 3 },
    rows: [
      {
        accountCode: "1.1.02.001",
        accountName: "Banco Cuenta Corriente",
        debitMovement: 1_190_000,
        creditMovement: 0,
        debitBalance: 1_190_000,
        creditBalance: 0,
        activo: 1_190_000,
        pasivo: 0,
        perdida: 0,
        ganancia: 0,
      },
      {
        accountCode: "2.1.01.001",
        accountName: "Proveedores Nacionales",
        debitMovement: 0,
        creditMovement: 595_000,
        debitBalance: 0,
        creditBalance: 595_000,
        activo: 0,
        pasivo: 595_000,
        perdida: 0,
        ganancia: 0,
      },
      {
        accountCode: "4.1.01.001",
        accountName: "Ventas Nacionales",
        debitMovement: 0,
        creditMovement: 1_000_000,
        debitBalance: 0,
        creditBalance: 1_000_000,
        activo: 0,
        pasivo: 0,
        perdida: 0,
        ganancia: 1_000_000,
      },
    ],
    totals: {
      debitMovement: 1_190_000,
      creditMovement: 1_595_000,
      debitBalance: 1_190_000,
      creditBalance: 1_595_000,
      activo: 1_190_000,
      pasivo: 595_000,
      perdida: 0,
      ganancia: 1_000_000,
    },
  };
}

describe("Balance 8 Columnas XML", () => {
  const config = {
    rut: "76.000.000-0",
    razonSocial: "Empresa Test SpA",
    period: { year: 2026, month: 3 },
  };

  it("should start with XML declaration", () => {
    const xml = generateBalanceXml(makeTestBalance(), config);
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="ISO-8859-1"\?>/);
  });

  it("should have Balance8Columnas root element", () => {
    const xml = generateBalanceXml(makeTestBalance(), config);
    expect(xml).toContain("<Balance8Columnas>");
    expect(xml).toContain("</Balance8Columnas>");
  });

  it("should include Caratula with correct data", () => {
    const xml = generateBalanceXml(makeTestBalance(), config);
    expect(xml).toContain("<RutEmpresa>76.000.000-0</RutEmpresa>");
    expect(xml).toContain("<RazonSocial>Empresa Test SpA</RazonSocial>");
    expect(xml).toContain("<Periodo>2026-03</Periodo>");
    expect(xml).toContain("<TotalCuentas>3</TotalCuentas>");
  });

  it("should have correct number of Cuenta elements", () => {
    const xml = generateBalanceXml(makeTestBalance(), config);
    const cuentaCount = (xml.match(/<Cuenta>/g) || []).length;
    expect(cuentaCount).toBe(3);
  });

  it("should render all 8 columns per account row", () => {
    const xml = generateBalanceXml(makeTestBalance(), config);
    expect(xml).toContain("<DebitosMes>1190000</DebitosMes>");
    expect(xml).toContain("<CreditosMes>0</CreditosMes>");
    expect(xml).toContain("<SaldoDeudor>1190000</SaldoDeudor>");
    expect(xml).toContain("<SaldoAcreedor>0</SaldoAcreedor>");
    expect(xml).toContain("<Activo>1190000</Activo>");
    expect(xml).toContain("<Pasivo>0</Pasivo>");
    expect(xml).toContain("<Perdida>0</Perdida>");
    expect(xml).toContain("<Ganancia>0</Ganancia>");
  });

  it("should include Totales section with correct sums", () => {
    const xml = generateBalanceXml(makeTestBalance(), config);
    expect(xml).toContain("<Totales>");
    expect(xml).toContain("</Totales>");

    // Check totals match the data we provided
    // Totales DebitosMes = 1,190,000
    // The totals section should have the aggregated values
    const totalesSection = xml.split("<Totales>")[1]!.split("</Totales>")[0]!;
    expect(totalesSection).toContain("<DebitosMes>1190000</DebitosMes>");
    expect(totalesSection).toContain("<CreditosMes>1595000</CreditosMes>");
    expect(totalesSection).toContain("<Activo>1190000</Activo>");
    expect(totalesSection).toContain("<Pasivo>595000</Pasivo>");
    expect(totalesSection).toContain("<Ganancia>1000000</Ganancia>");
  });

  it("should escape special characters in account names", () => {
    const balance = makeTestBalance();
    balance.rows[0]!.accountName = "Banco & Cia <Test>";
    const xml = generateBalanceXml(balance, config);
    expect(xml).toContain("Banco &amp; Cia &lt;Test&gt;");
  });
});
