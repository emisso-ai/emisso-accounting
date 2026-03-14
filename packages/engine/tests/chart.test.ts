import { describe, it, expect } from "vitest";
import { createChart, getNormalBalance } from "../src/accounts/chart.js";
import { siiAccounts, createSiiChart } from "../src/accounts/sii-chart.js";

describe("Chart of Accounts", () => {
  it("should create an empty chart", () => {
    const chart = createChart();
    expect(chart.toArray()).toHaveLength(0);
  });

  it("should add and retrieve accounts", () => {
    const chart = createChart();
    chart.addAccount({ code: "1", name: "Activo", type: "asset" });
    chart.addAccount({ code: "1.1", name: "Activo Circulante", type: "asset", parentCode: "1" });

    expect(chart.getAccount("1")).toBeDefined();
    expect(chart.getAccount("1")!.name).toBe("Activo");
    expect(chart.validateCode("1.1")).toBe(true);
    expect(chart.validateCode("9.9")).toBe(false);
  });

  it("should get children of an account", () => {
    const chart = createChart();
    chart.addAccount({ code: "1", name: "Activo", type: "asset" });
    chart.addAccount({ code: "1.1", name: "Circulante", type: "asset", parentCode: "1" });
    chart.addAccount({ code: "1.2", name: "Fijo", type: "asset", parentCode: "1" });

    const children = chart.getChildren("1");
    expect(children).toHaveLength(2);
  });

  it("should return correct normal balance direction", () => {
    expect(getNormalBalance("asset")).toBe("debit");
    expect(getNormalBalance("expense")).toBe("debit");
    expect(getNormalBalance("liability")).toBe("credit");
    expect(getNormalBalance("equity")).toBe("credit");
    expect(getNormalBalance("revenue")).toBe("credit");
  });

  it("should filter accounts by type", () => {
    const chart = createSiiChart();
    const assets = chart.getAccountsByType("asset");
    const liabilities = chart.getAccountsByType("liability");

    expect(assets.length).toBeGreaterThan(0);
    expect(liabilities.length).toBeGreaterThan(0);
    expect(assets.every((a) => a.type === "asset")).toBe(true);
  });

  it("should throw when adding account with non-existent parent", () => {
    const chart = createChart();
    expect(() =>
      chart.addAccount({ code: "1.1", name: "Sub", type: "asset", parentCode: "1" }),
    ).toThrow("Parent account not found");
  });

  it("should return undefined for non-existent account", () => {
    const chart = createChart();
    expect(chart.getAccount("999")).toBeUndefined();
  });

  it("should return sorted accounts from toArray", () => {
    const chart = createChart();
    chart.addAccount({ code: "2", name: "Pasivo", type: "liability" });
    chart.addAccount({ code: "1", name: "Activo", type: "asset" });
    const arr = chart.toArray();
    expect(arr[0]!.code).toBe("1");
    expect(arr[1]!.code).toBe("2");
  });

  it("should resolve normalBalance from chart", () => {
    const chart = createChart();
    chart.addAccount({ code: "1", name: "Activo", type: "asset" });
    chart.addAccount({ code: "2", name: "Pasivo", type: "liability" });
    expect(chart.normalBalance("1")).toBe("debit");
    expect(chart.normalBalance("2")).toBe("credit");
  });

  it("should throw when normalBalance called with unknown code", () => {
    const chart = createChart();
    expect(() => chart.normalBalance("999")).toThrow("Account not found");
  });
});

describe("SII Standard Chart", () => {
  it("should create SII chart with standard accounts", () => {
    const chart = createSiiChart();
    expect(chart.toArray().length).toBeGreaterThan(50);
  });

  it("should have all top-level categories", () => {
    const chart = createSiiChart();
    expect(chart.getAccount("1")).toBeDefined(); // Activo
    expect(chart.getAccount("2")).toBeDefined(); // Pasivo
    expect(chart.getAccount("3")).toBeDefined(); // Patrimonio
    expect(chart.getAccount("4")).toBeDefined(); // Resultado
  });

  it("should have key operating accounts", () => {
    const chart = createSiiChart();
    expect(chart.validateCode("1.1.01.001")).toBe(true); // Caja
    expect(chart.validateCode("1.1.02.001")).toBe(true); // Banco
    expect(chart.validateCode("2.1.02.001")).toBe(true); // IVA DF
    expect(chart.validateCode("1.1.06.001")).toBe(true); // IVA CF
    expect(chart.validateCode("4.1.01.001")).toBe(true); // Ventas
  });

  it("should correctly type accounts", () => {
    const chart = createSiiChart();
    expect(chart.getAccount("1")!.type).toBe("asset");
    expect(chart.getAccount("2")!.type).toBe("liability");
    expect(chart.getAccount("3")!.type).toBe("equity");
    expect(chart.getAccount("4.1.01.001")!.type).toBe("revenue");
    expect(chart.getAccount("4.2.01.001")!.type).toBe("expense");
  });

  it("should export siiAccounts array", () => {
    expect(siiAccounts.length).toBeGreaterThan(50);
    expect(siiAccounts[0]).toHaveProperty("code");
    expect(siiAccounts[0]).toHaveProperty("name");
    expect(siiAccounts[0]).toHaveProperty("type");
  });

  it("should have IVA accounts for tax handling", () => {
    const chart = createSiiChart();
    const ivaCF = chart.getAccount("1.1.06.001");
    const ivaDF = chart.getAccount("2.1.02.001");
    expect(ivaCF!.type).toBe("asset"); // IVA CF is an asset (recoverable)
    expect(ivaDF!.type).toBe("liability"); // IVA DF is a liability (payable)
  });

  it("should have payroll-related accounts", () => {
    const chart = createSiiChart();
    expect(chart.validateCode("4.3.01.001")).toBe(true); // Sueldos y Salarios
    expect(chart.validateCode("2.1.06.001")).toBe(true); // Sueldos por Pagar
    expect(chart.validateCode("2.1.03.002")).toBe(true); // Retencion AFP
    expect(chart.validateCode("2.1.03.003")).toBe(true); // Retencion Salud
  });
});
