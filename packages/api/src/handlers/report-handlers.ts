import type { HandlerFn } from "./router.js";
import type { LedgerService } from "../services/ledger-service.js";
import { handleEffect } from "../core/effect/http-response.js";
import { ValidationError } from "../core/effect/app-error.js";
import { ReportQuerySchema } from "../validation/schemas.js";
import { Effect } from "effect";

export interface ReportHandlersDeps {
  ledgerService: LedgerService;
}

export function createReportHandlers(deps: ReportHandlersDeps) {
  const { ledgerService } = deps;

  function parseReportQuery(req: Request) {
    const url = new URL(req.url);
    return ReportQuerySchema.safeParse({
      year: url.searchParams.get("year"),
      month: url.searchParams.get("month"),
    });
  }

  const getTrialBalance: HandlerFn = async (req, ctx) => {
    const query = parseReportQuery(req);
    if (!query.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid query params", query.error.issues)),
      );
    }
    return handleEffect(
      ledgerService.getTrialBalance(ctx.tenantId, query.data.year, query.data.month),
    );
  };

  const getBalance8Columnas: HandlerFn = async (req, ctx) => {
    const query = parseReportQuery(req);
    if (!query.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid query params", query.error.issues)),
      );
    }
    return handleEffect(
      ledgerService.getBalance8Columnas(ctx.tenantId, query.data.year, query.data.month),
    );
  };

  const getIncomeStatement: HandlerFn = async (req, ctx) => {
    const query = parseReportQuery(req);
    if (!query.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid query params", query.error.issues)),
      );
    }
    return handleEffect(
      ledgerService.getIncomeStatement(ctx.tenantId, query.data.year, query.data.month),
    );
  };

  const getBalanceSheet: HandlerFn = async (req, ctx) => {
    const query = parseReportQuery(req);
    if (!query.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid query params", query.error.issues)),
      );
    }
    return handleEffect(
      ledgerService.getBalanceSheet(ctx.tenantId, query.data.year, query.data.month),
    );
  };

  return { getTrialBalance, getBalance8Columnas, getIncomeStatement, getBalanceSheet };
}
