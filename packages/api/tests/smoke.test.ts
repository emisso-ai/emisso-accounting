import { describe, it, expect } from "vitest";

describe("@emisso/accounting-api", () => {
  it("should export core modules", async () => {
    const api = await import("../src/index.js");
    expect(api.createAccountRepo).toBeDefined();
    expect(api.createEntryRepo).toBeDefined();
    expect(api.createPeriodRepo).toBeDefined();
    expect(api.createLedgerService).toBeDefined();
    expect(api.createAccountService).toBeDefined();
    expect(api.createPeriodService).toBeDefined();
    expect(api.createTaxService).toBeDefined();
    expect(api.createRouter).toBeDefined();
  });

  it("should export error types", async () => {
    const api = await import("../src/index.js");
    expect(api.NotFoundError).toBeDefined();
    expect(api.ValidationError).toBeDefined();
    expect(api.UnbalancedEntryError).toBeDefined();
    expect(api.PeriodClosedError).toBeDefined();
    expect(api.AccountNotFoundError).toBeDefined();
  });

  it("should export schema tables", async () => {
    const api = await import("../src/index.js");
    expect(api.accounts).toBeDefined();
    expect(api.journalEntries).toBeDefined();
    expect(api.entryLines).toBeDefined();
    expect(api.periods).toBeDefined();
  });
});
