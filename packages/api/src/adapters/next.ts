/**
 * Next.js App Router adapter for @emisso/accounting-api.
 *
 * Usage in a Next.js catch-all route:
 *   // app/api/accounting/[...path]/route.ts
 *   import { createAccountingRouter } from "@emisso/accounting-api/next";
 *   export const { GET, POST, PUT, PATCH, DELETE } = createAccountingRouter({ ... });
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { createRouter, type Route } from "../handlers/router.js";
import { createAccountRepo } from "../repos/account-repo.js";
import { createEntryRepo } from "../repos/entry-repo.js";
import { createPeriodRepo } from "../repos/period-repo.js";
import { createAccountService } from "../services/account-service.js";
import { createPeriodService } from "../services/period-service.js";
import { createLedgerService } from "../services/ledger-service.js";
import { createTaxService } from "../services/tax-service.js";
import { createAccountHandlers } from "../handlers/account-handlers.js";
import { createEntryHandlers } from "../handlers/entry-handlers.js";
import { createReportHandlers } from "../handlers/report-handlers.js";
import { createTaxHandlers } from "../handlers/tax-handlers.js";
import { createPeriodHandlers } from "../handlers/period-handlers.js";

export interface AccountingRouterConfig {
  /** PostgreSQL connection string */
  databaseUrl: string;
  /** Base path for the API routes (e.g., "/api/accounting") */
  basePath: string;
  /**
   * Custom tenant ID resolver. Defaults to reading `X-Tenant-Id` header.
   * Return null to reject the request.
   */
  resolveTenantId?: (req: Request) => string | null | Promise<string | null>;
}

export function createAccountingRouter(config: AccountingRouterConfig) {
  const sql = postgres(config.databaseUrl);
  const db: PostgresJsDatabase = drizzle(sql);

  // Build repos
  const accountRepo = createAccountRepo(db as any);
  const entryRepo = createEntryRepo(db as any);
  const periodRepo = createPeriodRepo(db as any);

  // Build services
  const accountService = createAccountService({ accountRepo });
  const periodService = createPeriodService({ periodRepo });
  const ledgerService = createLedgerService({ entryRepo, accountRepo, periodService });
  const taxService = createTaxService({ entryRepo });

  // Build handlers
  const accountHandlers = createAccountHandlers({ accountService });
  const entryHandlers = createEntryHandlers({ ledgerService });
  const reportHandlers = createReportHandlers({ ledgerService });
  const taxHandlers = createTaxHandlers({ taxService });
  const periodHandlers = createPeriodHandlers({ periodService });

  const base = config.basePath;

  // Define routes
  const routes: Route[] = [
    // Accounts
    { method: "GET", pattern: `${base}/accounts`, handler: accountHandlers.listAccounts },
    { method: "POST", pattern: `${base}/accounts`, handler: accountHandlers.upsertAccount },
    { method: "POST", pattern: `${base}/accounts/seed`, handler: accountHandlers.seedChart },
    { method: "DELETE", pattern: `${base}/accounts/:code`, handler: accountHandlers.deleteAccount },

    // Entries
    { method: "POST", pattern: `${base}/entries`, handler: entryHandlers.createEntry },
    { method: "GET", pattern: `${base}/entries`, handler: entryHandlers.listEntries },
    { method: "POST", pattern: `${base}/entries/:entryId/void`, handler: entryHandlers.voidEntry },

    // Reports
    { method: "GET", pattern: `${base}/reports/trial-balance`, handler: reportHandlers.getTrialBalance },
    { method: "GET", pattern: `${base}/reports/balance-8-columnas`, handler: reportHandlers.getBalance8Columnas },
    { method: "GET", pattern: `${base}/reports/income-statement`, handler: reportHandlers.getIncomeStatement },
    { method: "GET", pattern: `${base}/reports/balance-sheet`, handler: reportHandlers.getBalanceSheet },

    // Tax
    { method: "GET", pattern: `${base}/tax/iva`, handler: taxHandlers.getIva },
    { method: "GET", pattern: `${base}/tax/ppm`, handler: taxHandlers.getPpm },
    { method: "GET", pattern: `${base}/tax/f29`, handler: taxHandlers.getF29 },

    // Periods
    { method: "GET", pattern: `${base}/periods`, handler: periodHandlers.listPeriods },
    { method: "POST", pattern: `${base}/periods`, handler: periodHandlers.openPeriod },
    { method: "PATCH", pattern: `${base}/periods`, handler: periodHandlers.updatePeriod },
  ];

  const router = createRouter(routes);

  const resolveTenantId =
    config.resolveTenantId ??
    ((req: Request) => req.headers.get("X-Tenant-Id"));

  async function handle(req: Request): Promise<Response> {
    const tenantId = await resolveTenantId(req);
    if (!tenantId) {
      return Response.json(
        { error: { _type: "ForbiddenError", message: "Missing tenant ID" } },
        { status: 403 },
      );
    }
    return router(req, tenantId);
  }

  return {
    GET: handle,
    POST: handle,
    PUT: handle,
    PATCH: handle,
    DELETE: handle,
  };
}
