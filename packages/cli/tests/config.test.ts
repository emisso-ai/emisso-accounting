import { describe, expect, it, afterEach } from "vitest";
import { Option } from "effect";
import {
  resolveLedgerPath,
  resolvePeriod,
  parsePeriod,
  resolveRegime,
  resolveCompany,
  resolveAccountType,
} from "../src/config/resolve";

describe("resolveLedgerPath", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("resolves from CLI flag", () => {
    const path = resolveLedgerPath({ ledger: Option.some("/path/ledger.json") });
    expect(path).toBe("/path/ledger.json");
  });

  it("falls back to env var", () => {
    process.env.ACCOUNTING_LEDGER = "/env/ledger.json";
    const path = resolveLedgerPath({ ledger: Option.none() });
    expect(path).toBe("/env/ledger.json");
  });

  it("CLI flag takes precedence over env var", () => {
    process.env.ACCOUNTING_LEDGER = "/env/ledger.json";
    const path = resolveLedgerPath({ ledger: Option.some("/flag/ledger.json") });
    expect(path).toBe("/flag/ledger.json");
  });

  it("throws on missing ledger path", () => {
    delete process.env.ACCOUNTING_LEDGER;
    expect(() => resolveLedgerPath({ ledger: Option.none() })).toThrow(
      "Missing required option: --ledger",
    );
  });
});

describe("parsePeriod", () => {
  it("parses valid YYYY-MM", () => {
    const period = parsePeriod("2025-03");
    expect(period).toEqual({ year: 2025, month: 3 });
  });

  it("parses January", () => {
    expect(parsePeriod("2024-01")).toEqual({ year: 2024, month: 1 });
  });

  it("parses December", () => {
    expect(parsePeriod("2024-12")).toEqual({ year: 2024, month: 12 });
  });

  it("throws on invalid format", () => {
    expect(() => parsePeriod("2024")).toThrow("Invalid period format");
  });

  it("throws on invalid month 0", () => {
    expect(() => parsePeriod("2024-00")).toThrow("Invalid month");
  });

  it("throws on invalid month 13", () => {
    expect(() => parsePeriod("2024-13")).toThrow("Invalid month");
  });
});

describe("resolvePeriod", () => {
  it("resolves from flag", () => {
    const period = resolvePeriod({ period: Option.some("2025-06") });
    expect(period).toEqual({ year: 2025, month: 6 });
  });

  it("throws on missing period", () => {
    expect(() => resolvePeriod({ period: Option.none() })).toThrow(
      "Missing required option: --period",
    );
  });
});

describe("resolveRegime", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("resolves 14A from flag", () => {
    expect(resolveRegime({ regime: Option.some("14A") })).toBe("14A");
  });

  it("resolves 14D-N3 from flag", () => {
    expect(resolveRegime({ regime: Option.some("14D-N3") })).toBe("14D-N3");
  });

  it("resolves 14D-N8 from flag", () => {
    expect(resolveRegime({ regime: Option.some("14D-N8") })).toBe("14D-N8");
  });

  it("falls back to env var", () => {
    process.env.ACCOUNTING_REGIME = "14A";
    expect(resolveRegime({ regime: Option.none() })).toBe("14A");
  });

  it("throws on missing regime", () => {
    delete process.env.ACCOUNTING_REGIME;
    expect(() => resolveRegime({ regime: Option.none() })).toThrow(
      "Missing required option: --regime",
    );
  });

  it("throws on invalid regime", () => {
    expect(() => resolveRegime({ regime: Option.some("15B") })).toThrow(
      "Invalid regime: 15B",
    );
  });
});

describe("resolveCompany", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("resolves from CLI flags", () => {
    const company = resolveCompany({
      rut: Option.some("76123456-0"),
      razonSocial: Option.some("Empresa SA"),
    });
    expect(company.rut).toBe("76123456-0");
    expect(company.razonSocial).toBe("Empresa SA");
  });

  it("falls back to env vars", () => {
    process.env.ACCOUNTING_RUT = "76123456-0";
    process.env.ACCOUNTING_RAZON_SOCIAL = "Empresa SA";
    const company = resolveCompany({
      rut: Option.none(),
      razonSocial: Option.none(),
    });
    expect(company.rut).toBe("76123456-0");
    expect(company.razonSocial).toBe("Empresa SA");
  });

  it("throws on missing rut", () => {
    delete process.env.ACCOUNTING_RUT;
    expect(() =>
      resolveCompany({
        rut: Option.none(),
        razonSocial: Option.some("Empresa SA"),
      }),
    ).toThrow("Missing required option: --rut");
  });

  it("throws on missing razon social", () => {
    delete process.env.ACCOUNTING_RAZON_SOCIAL;
    expect(() =>
      resolveCompany({
        rut: Option.some("76123456-0"),
        razonSocial: Option.none(),
      }),
    ).toThrow("Missing required option: --razon-social");
  });
});

describe("resolveAccountType", () => {
  it("returns undefined for None", () => {
    expect(resolveAccountType(Option.none())).toBeUndefined();
  });

  it("resolves valid types", () => {
    expect(resolveAccountType(Option.some("asset"))).toBe("asset");
    expect(resolveAccountType(Option.some("liability"))).toBe("liability");
    expect(resolveAccountType(Option.some("equity"))).toBe("equity");
    expect(resolveAccountType(Option.some("revenue"))).toBe("revenue");
    expect(resolveAccountType(Option.some("expense"))).toBe("expense");
  });

  it("throws on invalid type", () => {
    expect(() => resolveAccountType(Option.some("banana"))).toThrow(
      "Invalid account type: banana",
    );
  });
});
