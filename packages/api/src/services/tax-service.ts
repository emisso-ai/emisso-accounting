import { Effect } from "effect";
import {
  calculateIva,
  calculatePpm,
  prepareF29,
  type IvaResult,
  type PpmResult,
  type F29Data,
  type JournalEntry,
} from "@emisso/accounting";
import type { EntryRepo } from "../repos/entry-repo.js";
import { loadPeriodEntries } from "../core/bridge.js";
import type { AppError } from "../core/effect/app-error.js";

export interface TaxServiceDeps {
  entryRepo: EntryRepo;
}

export function createTaxService(deps: TaxServiceDeps) {
  const { entryRepo } = deps;

  function loadEntries(
    tenantId: string,
    year: number,
    month: number,
  ): Effect.Effect<JournalEntry[], AppError> {
    return loadPeriodEntries(entryRepo, tenantId, year, month);
  }

  return {
    getIva(
      tenantId: string,
      year: number,
      month: number,
      ivaRemanenteAnterior?: number,
    ): Effect.Effect<IvaResult, AppError> {
      return loadEntries(tenantId, year, month).pipe(
        Effect.map((entries) =>
          calculateIva(entries, { year, month }, { ivaRemanenteAnterior }),
        ),
      );
    },

    getPpm(
      tenantId: string,
      year: number,
      month: number,
      regime: "14A" | "14D-N3" | "14D-N8" = "14A",
    ): Effect.Effect<PpmResult, AppError> {
      return loadEntries(tenantId, year, month).pipe(
        Effect.map((entries) =>
          calculatePpm(entries, { year, month }, { regime }),
        ),
      );
    },

    getF29(
      tenantId: string,
      year: number,
      month: number,
      regime: "14A" | "14D-N3" | "14D-N8" = "14A",
      ivaRemanenteAnterior?: number,
    ): Effect.Effect<F29Data, AppError> {
      return loadEntries(tenantId, year, month).pipe(
        Effect.map((entries) =>
          prepareF29(entries, { year, month }, { regime, ivaRemanenteAnterior }),
        ),
      );
    },
  };
}

export type TaxService = ReturnType<typeof createTaxService>;
