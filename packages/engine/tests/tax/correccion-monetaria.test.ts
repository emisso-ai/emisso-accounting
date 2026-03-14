import { describe, it, expect } from "vitest";
import type { AccountBalance } from "../../src/types.js";
import { calculateCorreccionMonetaria } from "../../src/tax/correccion-monetaria.js";

function makeEquityBalances(capitalSocial: number): AccountBalance[] {
  return [
    {
      accountCode: "3.1.01.001",
      accountName: "Capital Social",
      debit: 0,
      credit: capitalSocial,
      balance: capitalSocial,
    },
  ];
}

describe("Correccion Monetaria", () => {
  const period = { year: 2026, month: 3 };

  it("should calculate revalorizacion from capital propio and IPC variation", () => {
    // Capital propio = $10,000,000, IPC = 0.5%
    // Revalorizacion = 10,000,000 * 0.5 / 100 = $50,000
    const balances = makeEquityBalances(10_000_000);
    const result = calculateCorreccionMonetaria(balances, period, 0.5);

    expect(result.capitalPropioInicial).toBe(10_000_000);
    expect(result.revalorizacion).toBe(50_000);
  });

  it("should generate a balanced journal entry for positive IPC", () => {
    const balances = makeEquityBalances(10_000_000);
    const result = calculateCorreccionMonetaria(balances, period, 0.5);

    expect(result.entries).toHaveLength(1);
    const entry = result.entries[0]!;
    expect(entry.description).toContain("Correccion Monetaria Capital Propio");
    expect(entry.date).toBe("2026-03-31");

    // Positive IPC: Debit CM Perdida, Credit Reval Capital Propio
    const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDebit).toBe(50_000);
    expect(totalCredit).toBe(50_000);

    // Verify account codes
    expect(entry.lines[0]!.accountCode).toBe("4.5.02.002"); // CM Perdida
    expect(entry.lines[1]!.accountCode).toBe("3.1.03.001"); // Reval Capital Propio
  });

  it("should handle zero IPC variation", () => {
    const balances = makeEquityBalances(10_000_000);
    const result = calculateCorreccionMonetaria(balances, period, 0);

    expect(result.revalorizacion).toBe(0);
    expect(result.entries).toHaveLength(0);
  });

  it("should handle negative IPC (deflation)", () => {
    const balances = makeEquityBalances(10_000_000);
    const result = calculateCorreccionMonetaria(balances, period, -0.3);

    // Revalorizacion = 10,000,000 * (-0.3) / 100 = -30,000
    expect(result.revalorizacion).toBe(-30_000);
    expect(result.entries).toHaveLength(1);

    const entry = result.entries[0]!;
    // Negative IPC: Debit Reval Capital, Credit CM Ganancia
    expect(entry.lines[0]!.accountCode).toBe("3.1.03.001"); // Reval Capital (debit)
    expect(entry.lines[0]!.debit).toBe(30_000);
    expect(entry.lines[1]!.accountCode).toBe("4.4.02.002"); // CM Ganancia (credit)
    expect(entry.lines[1]!.credit).toBe(30_000);
  });

  it("should revalorize fixed assets in addition to capital propio", () => {
    const balances: AccountBalance[] = [
      {
        accountCode: "3.1.01.001",
        accountName: "Capital Social",
        debit: 0,
        credit: 5_000_000,
        balance: 5_000_000,
      },
      {
        accountCode: "1.2.03",
        accountName: "Maquinaria y Equipos",
        debit: 2_000_000,
        credit: 0,
        balance: 2_000_000,
      },
    ];

    const result = calculateCorreccionMonetaria(balances, period, 1.0);

    // Capital propio revalorizacion = 5,000,000 * 1.0% = 50,000
    expect(result.capitalPropioInicial).toBe(5_000_000);
    expect(result.revalorizacion).toBe(50_000);

    // Fixed asset revalorizacion = 2,000,000 * 1.0% = 20,000
    // Total entries: 1 for capital propio + 1 for fixed asset
    expect(result.entries).toHaveLength(2);

    const assetEntry = result.entries[1]!;
    expect(assetEntry.description).toContain("CM Activo Fijo");
    // Positive IPC on asset: Debit Asset, Credit CM Ganancia
    expect(assetEntry.lines[0]!.accountCode).toBe("1.2.03");
    expect(assetEntry.lines[0]!.debit).toBe(20_000);
    expect(assetEntry.lines[1]!.accountCode).toBe("4.4.02.002");
    expect(assetEntry.lines[1]!.credit).toBe(20_000);
  });

  it("should round revalorizacion to integer", () => {
    // 7,777,777 * 0.3 / 100 = 23,333.331 → 23,333
    const balances = makeEquityBalances(7_777_777);
    const result = calculateCorreccionMonetaria(balances, period, 0.3);

    expect(result.revalorizacion).toBe(23_333);
  });
});
