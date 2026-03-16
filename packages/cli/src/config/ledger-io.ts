/**
 * Ledger file I/O — read/write JSON ledger files
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import {
  createLedger,
  createSiiChart,
  type Ledger,
  type LedgerConfig,
  type JournalEntry,
} from "@emisso/accounting";
import { CliError } from "@emisso/cli-core";
import { Effect } from "effect";

interface LedgerJson {
  config: LedgerConfig;
  entries: JournalEntry[];
}

/** Lazily cached SII chart — created once per process */
let _siiChart: ReturnType<typeof createSiiChart> | undefined;
function getSiiChart() {
  return (_siiChart ??= createSiiChart());
}

export function loadLedger(path: string): Ledger {
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      throw new CliError({
        kind: "not-found",
        message: `Ledger file not found: ${path}`,
        detail: "Create a ledger first with: accounting chart seed --ledger <path>",
      });
    }
    throw new CliError({
      kind: "general",
      message: `Failed to read ledger file: ${path}`,
      detail: err.message,
    });
  }

  try {
    const data = JSON.parse(raw) as LedgerJson;
    return createLedger({
      chart: getSiiChart(),
      config: data.config,
      entries: data.entries,
    });
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError({
      kind: "general",
      message: `Failed to parse ledger file: ${path}`,
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

export function saveLedger(path: string, ledger: Ledger): void {
  try {
    const data = ledger.toJSON();
    writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
  } catch (error) {
    throw new CliError({
      kind: "general",
      message: `Failed to write ledger file: ${path}`,
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

export function initLedger(path: string, config?: LedgerConfig): Ledger {
  if (existsSync(path)) {
    throw new CliError({
      kind: "validation",
      message: `Ledger file already exists: ${path}`,
      detail: "Use --force to overwrite, or choose a different path",
    });
  }
  const ledger = createLedger({ chart: getSiiChart(), config });
  saveLedger(path, ledger);
  return ledger;
}

export function initLedgerForce(path: string, config?: LedgerConfig): Ledger {
  const ledger = createLedger({ chart: getSiiChart(), config });
  saveLedger(path, ledger);
  return ledger;
}

/* ── Effect wrappers ───────────────────────────────────────────── */

export const loadLedgerEffect = (path: string): Effect.Effect<Ledger, CliError> =>
  Effect.try({
    try: () => loadLedger(path),
    catch: (e) => e instanceof CliError ? e : new CliError({
      kind: "general",
      message: "Failed to load ledger",
      detail: e instanceof Error ? e.message : String(e),
    }),
  });

export const saveLedgerEffect = (path: string, ledger: Ledger): Effect.Effect<void, CliError> =>
  Effect.try({
    try: () => saveLedger(path, ledger),
    catch: (e) => e instanceof CliError ? e : new CliError({
      kind: "general",
      message: "Failed to save ledger",
      detail: e instanceof Error ? e.message : String(e),
    }),
  });
