import { Effect } from "effect";
import type { PeriodRepo } from "../repos/period-repo.js";
import type { PeriodRow } from "../db/schema/periods.js";
import { ConflictError, PeriodClosedError, type AppError } from "../core/effect/app-error.js";

export interface PeriodServiceDeps {
  periodRepo: PeriodRepo;
}

export function createPeriodService(deps: PeriodServiceDeps) {
  const { periodRepo } = deps;

  return {
    listPeriods(tenantId: string): Effect.Effect<PeriodRow[], AppError> {
      return periodRepo.findAll(tenantId);
    },

    openPeriod(tenantId: string, year: number, month: number): Effect.Effect<PeriodRow, AppError> {
      return periodRepo.upsert({
        tenantId,
        year,
        month,
        status: "open",
      });
    },

    closePeriod(tenantId: string, year: number, month: number): Effect.Effect<PeriodRow, AppError> {
      return periodRepo.findByYearMonth(tenantId, year, month).pipe(
        Effect.flatMap((period): Effect.Effect<PeriodRow, AppError> => {
          if (period.status === "locked") {
            return Effect.fail(ConflictError.make(
              `Period ${year}-${month} is locked and cannot be closed`,
              "Period",
            ));
          }
          return periodRepo.updateStatus(tenantId, year, month, "closed");
        }),
      );
    },

    lockPeriod(tenantId: string, year: number, month: number): Effect.Effect<PeriodRow, AppError> {
      return periodRepo.findByYearMonth(tenantId, year, month).pipe(
        Effect.flatMap((period): Effect.Effect<PeriodRow, AppError> => {
          if (period.status !== "closed") {
            return Effect.fail(ConflictError.make(
              `Period ${year}-${month} must be closed before locking`,
              "Period",
            ));
          }
          return periodRepo.updateStatus(tenantId, year, month, "locked");
        }),
      );
    },

    /**
     * Check if a period is open for new entries.
     * If the period doesn't exist yet, treat it as implicitly open.
     */
    assertOpen(tenantId: string, year: number, month: number): Effect.Effect<void, AppError> {
      return periodRepo.findByYearMonth(tenantId, year, month).pipe(
        Effect.flatMap((period) => {
          if (period.status !== "open") {
            return Effect.fail(
              PeriodClosedError.make(
                `${year}-${String(month).padStart(2, "0")}`,
                period.closedAt?.toISOString(),
              ),
            );
          }
          return Effect.void;
        }),
        // If period not found, treat as implicitly open
        Effect.catchTag("NotFoundError", () => Effect.void),
      );
    },
  };
}

export type PeriodService = ReturnType<typeof createPeriodService>;
