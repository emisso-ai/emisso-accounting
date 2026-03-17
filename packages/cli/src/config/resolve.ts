/**
 * Config resolution: CLI flags → env vars → defaults
 *
 * Each resolver has a sync version (throws CliError) and an Effect version
 * (returns Effect<T, CliError>) to avoid try/catch boilerplate in commands.
 */

import type { FiscalPeriod } from "@emisso/accounting";
import { CliError } from "@emisso/cli-core";
import { Effect, Option as O } from "effect";
import type { Option } from "effect";

export interface LedgerFlags {
  ledger: Option.Option<string>;
}

export interface CompanyFlags {
  rut: Option.Option<string>;
  razonSocial: Option.Option<string>;
}

export interface RegimeFlags {
  regime: Option.Option<string>;
}

const VALID_ACCOUNT_TYPES = ["asset", "liability", "equity", "revenue", "expense"] as const;
type AccountType = (typeof VALID_ACCOUNT_TYPES)[number];

/* ── Sync resolvers (used in tests) ────────────────────────────── */

export function resolveLedgerPath(flags: LedgerFlags): string {
  const flagValue = O.getOrUndefined(flags.ledger);
  if (flagValue !== undefined) return flagValue;

  const envValue = process.env.ACCOUNTING_LEDGER;
  if (envValue !== undefined && envValue !== "") return envValue;

  throw new CliError({
    kind: "bad-args",
    message: "Missing required option: --ledger",
    detail: "Provide --ledger <path> or set ACCOUNTING_LEDGER environment variable",
  });
}

export function parsePeriod(value: string): FiscalPeriod {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new CliError({
      kind: "bad-args",
      message: `Invalid period format: ${value}`,
      detail: "Expected YYYY-MM (e.g. 2024-03)",
    });
  }
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) {
    throw new CliError({
      kind: "bad-args",
      message: `Invalid month: ${month}`,
      detail: "Month must be between 1 and 12",
    });
  }
  return { year: parseInt(match[1], 10), month };
}

export function resolvePeriod(flags: { period: string } | { period: Option.Option<string> }): FiscalPeriod {
  const value = typeof flags.period === "string"
    ? flags.period
    : O.getOrUndefined(flags.period);
  if (value === undefined) {
    throw new CliError({
      kind: "bad-args",
      message: "Missing required option: --period",
      detail: "Provide --period YYYY-MM",
    });
  }
  return parsePeriod(value);
}

export function resolveRegime(flags: RegimeFlags): "14A" | "14D-N3" | "14D-N8" {
  const value = O.getOrUndefined(flags.regime) ?? process.env.ACCOUNTING_REGIME;
  if (!value) {
    throw new CliError({
      kind: "bad-args",
      message: "Missing required option: --regime",
      detail: "Provide --regime 14A|14D-N3|14D-N8 or set ACCOUNTING_REGIME",
    });
  }
  if (value !== "14A" && value !== "14D-N3" && value !== "14D-N8") {
    throw new CliError({
      kind: "bad-args",
      message: `Invalid regime: ${value}`,
      detail: "Must be '14A', '14D-N3', or '14D-N8'",
    });
  }
  return value;
}

export function resolveCompany(flags: CompanyFlags): { rut: string; razonSocial: string } {
  const rut = O.getOrUndefined(flags.rut) ?? process.env.ACCOUNTING_RUT;
  if (!rut) {
    throw new CliError({
      kind: "bad-args",
      message: "Missing required option: --rut",
      detail: "Provide --rut or set ACCOUNTING_RUT environment variable",
    });
  }
  const razonSocial = O.getOrUndefined(flags.razonSocial) ?? process.env.ACCOUNTING_RAZON_SOCIAL;
  if (!razonSocial) {
    throw new CliError({
      kind: "bad-args",
      message: "Missing required option: --razon-social",
      detail: "Provide --razon-social or set ACCOUNTING_RAZON_SOCIAL environment variable",
    });
  }
  return { rut, razonSocial };
}

export function resolveAccountType(type: Option.Option<string>): AccountType | undefined {
  const value = O.getOrUndefined(type);
  if (value === undefined) return undefined;
  if (!VALID_ACCOUNT_TYPES.includes(value as AccountType)) {
    throw new CliError({
      kind: "bad-args",
      message: `Invalid account type: ${value}`,
      detail: `Must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}`,
    });
  }
  return value as AccountType;
}

/* ── Effect wrappers (used in commands) ────────────────────────── */

function wrapResolve<A>(fn: () => A): Effect.Effect<A, CliError> {
  return Effect.try({
    try: fn,
    catch: (e) => e instanceof CliError ? e : new CliError({
      kind: "general",
      message: "Configuration error",
      detail: e instanceof Error ? e.message : String(e),
    }),
  });
}

export const resolveLedgerPathEffect = (flags: LedgerFlags) =>
  wrapResolve(() => resolveLedgerPath(flags));

export const resolvePeriodEffect = (flags: { period: string } | { period: Option.Option<string> }) =>
  wrapResolve(() => resolvePeriod(flags));

export const resolveRegimeEffect = (flags: RegimeFlags) =>
  wrapResolve(() => resolveRegime(flags));

export const resolveCompanyEffect = (flags: CompanyFlags) =>
  wrapResolve(() => resolveCompany(flags));

export const resolveAccountTypeEffect = (type: Option.Option<string>) =>
  wrapResolve(() => resolveAccountType(type));
