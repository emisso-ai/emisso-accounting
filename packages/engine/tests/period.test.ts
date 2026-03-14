import { describe, it, expect } from "vitest";
import { createPeriodManager } from "../src/ledger/period.js";
import { createSiiChart } from "../src/accounts/sii-chart.js";
import type { AccountBalance } from "../src/types.js";

describe("PeriodManager", () => {
  describe("Open / Close / Lock transitions", () => {
    it("should create periods in open state by default", () => {
      const pm = createPeriodManager();
      const period = pm.getPeriod(2026, 3);
      expect(period.status).toBe("open");
      expect(period.year).toBe(2026);
      expect(period.month).toBe(3);
    });

    it("should allow opening an already open period", () => {
      const pm = createPeriodManager();
      const period = pm.openPeriod(2026, 3);
      expect(period.status).toBe("open");
    });

    it("should close an open period", () => {
      const pm = createPeriodManager();
      const period = pm.closePeriod(2026, 3);
      expect(period.status).toBe("closed");
      expect(period.closedAt).toBeDefined();
    });

    it("should lock a closed period", () => {
      const pm = createPeriodManager();
      pm.closePeriod(2026, 3);
      const locked = pm.lockPeriod(2026, 3);
      expect(locked.status).toBe("locked");
      expect(locked.lockedAt).toBeDefined();
    });

    it("should reopen a closed period", () => {
      const pm = createPeriodManager();
      pm.closePeriod(2026, 3);
      const reopened = pm.reopenPeriod(2026, 3);
      expect(reopened.status).toBe("open");
      expect(reopened.closedAt).toBeUndefined();
    });
  });

  describe("Reject entries on closed period", () => {
    it("should report open period can add entries", () => {
      const pm = createPeriodManager();
      expect(pm.canAddEntries(2026, 3)).toBe(true);
    });

    it("should report closed period cannot add entries", () => {
      const pm = createPeriodManager();
      pm.closePeriod(2026, 3);
      expect(pm.canAddEntries(2026, 3)).toBe(false);
    });

    it("should report locked period cannot add entries", () => {
      const pm = createPeriodManager();
      pm.closePeriod(2026, 3);
      pm.lockPeriod(2026, 3);
      expect(pm.canAddEntries(2026, 3)).toBe(false);
    });

    it("should report canAddEntries correctly after close", () => {
      const pm = createPeriodManager();
      expect(pm.canAddEntries(2026, 3)).toBe(true);
      pm.closePeriod(2026, 3);
      expect(pm.canAddEntries(2026, 3)).toBe(false);
    });
  });

  describe("Lock prevents reopen", () => {
    it("should throw when trying to reopen a locked period", () => {
      const pm = createPeriodManager();
      pm.closePeriod(2026, 3);
      pm.lockPeriod(2026, 3);
      expect(() => pm.reopenPeriod(2026, 3)).toThrow("locked and cannot be reopened");
    });

    it("should throw when trying to close a locked period", () => {
      const pm = createPeriodManager();
      pm.closePeriod(2026, 3);
      pm.lockPeriod(2026, 3);
      expect(() => pm.closePeriod(2026, 3)).toThrow("locked and cannot be closed");
    });

    it("should throw when trying to lock an open period", () => {
      const pm = createPeriodManager();
      expect(() => pm.lockPeriod(2026, 3)).toThrow("must be closed before locking");
    });
  });

  describe("Closing entries generation", () => {
    it("should generate closing entries for revenue and expense accounts", () => {
      const pm = createPeriodManager();
      const chart = createSiiChart();

      const balances: AccountBalance[] = [
        {
          accountCode: "4.1.01.001",
          accountName: "Ventas Nacionales",
          debit: 0,
          credit: 1_000_000,
          balance: 1_000_000, // revenue: credit normal, balance = credit - debit
        },
        {
          accountCode: "4.2.01.001",
          accountName: "Costo de Mercaderias Vendidas",
          debit: 500_000,
          credit: 0,
          balance: 500_000, // expense: debit normal, balance = debit - credit
        },
        {
          accountCode: "4.3.01.001",
          accountName: "Sueldos y Salarios",
          debit: 800_000,
          credit: 0,
          balance: 800_000,
        },
        {
          // Non-temporary account — should be ignored
          accountCode: "1.1.02.001",
          accountName: "Banco",
          debit: 1_190_000,
          credit: 0,
          balance: 1_190_000,
        },
      ];

      const closingEntries = pm.generateClosingEntries(
        2026,
        3,
        balances,
        chart,
        "3.2.01.001", // Utilidad del Ejercicio
      );

      expect(closingEntries).toHaveLength(2); // one for revenue, one for expenses

      // Revenue closing: debit Ventas 1,000,000 / credit Utilidad 1,000,000
      const revenueClosing = closingEntries.find((e) =>
        e.description.includes("ingresos"),
      )!;
      expect(revenueClosing).toBeDefined();
      expect(revenueClosing.lines).toHaveLength(2);

      const ventasLine = revenueClosing.lines.find(
        (l) => l.accountCode === "4.1.01.001",
      )!;
      expect(ventasLine.debit).toBe(1_000_000);
      expect(ventasLine.credit).toBe(0);

      const utilidadCreditLine = revenueClosing.lines.find(
        (l) => l.accountCode === "3.2.01.001",
      )!;
      expect(utilidadCreditLine.credit).toBe(1_000_000);

      // Expense closing: credit Costo 500,000 + credit Sueldos 800,000 / debit Utilidad 1,300,000
      const expenseClosing = closingEntries.find((e) =>
        e.description.includes("gastos"),
      )!;
      expect(expenseClosing).toBeDefined();
      expect(expenseClosing.lines).toHaveLength(3); // 2 expense accounts + 1 retained earnings

      const utilidadDebitLine = expenseClosing.lines.find(
        (l) => l.accountCode === "3.2.01.001",
      )!;
      expect(utilidadDebitLine.debit).toBe(1_300_000);
    });

    it("should not generate entries when there are no temporary accounts", () => {
      const pm = createPeriodManager();
      const chart = createSiiChart();

      const balances: AccountBalance[] = [
        {
          accountCode: "1.1.02.001",
          accountName: "Banco",
          debit: 500_000,
          credit: 0,
          balance: 500_000,
        },
      ];

      const closingEntries = pm.generateClosingEntries(
        2026,
        3,
        balances,
        chart,
        "3.2.01.001",
      );

      expect(closingEntries).toHaveLength(0);
    });

    it("should skip accounts with zero balance", () => {
      const pm = createPeriodManager();
      const chart = createSiiChart();

      const balances: AccountBalance[] = [
        {
          accountCode: "4.1.01.001",
          accountName: "Ventas Nacionales",
          debit: 100_000,
          credit: 100_000,
          balance: 0, // net zero — should be skipped
        },
      ];

      const closingEntries = pm.generateClosingEntries(
        2026,
        3,
        balances,
        chart,
        "3.2.01.001",
      );

      expect(closingEntries).toHaveLength(0);
    });

    it("should set closing date to last day of the month", () => {
      const pm = createPeriodManager();
      const chart = createSiiChart();

      const balances: AccountBalance[] = [
        {
          accountCode: "4.1.01.001",
          accountName: "Ventas Nacionales",
          debit: 0,
          credit: 100_000,
          balance: 100_000,
        },
      ];

      const entries = pm.generateClosingEntries(2026, 3, balances, chart, "3.2.01.001");
      expect(entries[0]!.date).toBe("2026-03-31");

      // February
      const febEntries = pm.generateClosingEntries(
        2026,
        2,
        balances,
        chart,
        "3.2.01.001",
      );
      expect(febEntries[0]!.date).toBe("2026-02-28");
    });

    it("should attach metadata to closing entries", () => {
      const pm = createPeriodManager();
      const chart = createSiiChart();

      const balances: AccountBalance[] = [
        {
          accountCode: "4.1.01.001",
          accountName: "Ventas",
          debit: 0,
          credit: 100_000,
          balance: 100_000,
        },
      ];

      const entries = pm.generateClosingEntries(2026, 3, balances, chart, "3.2.01.001");
      expect(entries[0]!.metadata).toEqual({
        type: "closing",
        period: { year: 2026, month: 3 },
      });
    });
  });

  describe("Multiple periods", () => {
    it("should manage multiple periods independently", () => {
      const pm = createPeriodManager();
      pm.closePeriod(2026, 1);
      pm.closePeriod(2026, 2);

      expect(pm.canAddEntries(2026, 1)).toBe(false);
      expect(pm.canAddEntries(2026, 2)).toBe(false);
      expect(pm.canAddEntries(2026, 3)).toBe(true); // never touched, default open
    });
  });
});
