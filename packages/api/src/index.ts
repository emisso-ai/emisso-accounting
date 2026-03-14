// ── Schema exports ──
export { accountingSchema } from "./db/schema/index.js";
export * from "./db/schema/index.js";

// ── Core ──
export {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  DbError,
  ConflictError,
  UnbalancedEntryError,
  PeriodClosedError,
  AccountNotFoundError,
  isAppError,
  serializeAppError,
  type AppError,
} from "./core/effect/app-error.js";
export {
  toErrorResponse,
  toErrorResponseFromUnknown,
  handleEffect,
  jsonResponse,
  createdResponse,
  noContentResponse,
} from "./core/effect/http-response.js";
export { queryOneOrFail } from "./core/effect/repo-helpers.js";
export {
  accountRowToEngine,
  entryLineRowToEngine,
  entryWithLinesToEngine,
} from "./core/bridge.js";

// ── Validation ──
export {
  UpsertAccountSchema,
  CreateEntrySchema,
  CreateEntryLineSchema,
  VoidEntrySchema,
  PeriodQuerySchema,
  OpenPeriodSchema,
  UpdatePeriodSchema,
  ListEntriesQuerySchema,
  ReportQuerySchema,
  TaxQuerySchema,
} from "./validation/schemas.js";
export type {
  UpsertAccountInput,
  CreateEntryInput,
  VoidEntryInput,
  PeriodQuery,
  OpenPeriodInput,
  UpdatePeriodInput,
  ListEntriesQuery,
  ReportQuery,
  TaxQuery,
} from "./validation/schemas.js";

// ── Repos ──
export { createAccountRepo, type AccountRepo } from "./repos/account-repo.js";
export { createEntryRepo, type EntryRepo, type EntryWithLines } from "./repos/entry-repo.js";
export { createPeriodRepo, type PeriodRepo } from "./repos/period-repo.js";

// ── Services ──
export { createAccountService, type AccountService } from "./services/account-service.js";
export { createPeriodService, type PeriodService } from "./services/period-service.js";
export { createLedgerService, type LedgerService } from "./services/ledger-service.js";
export { createTaxService, type TaxService } from "./services/tax-service.js";

// ── Handlers ──
export { createRouter, type Route, type HandlerFn, type HandlerContext } from "./handlers/router.js";
export { createAccountHandlers } from "./handlers/account-handlers.js";
export { createEntryHandlers } from "./handlers/entry-handlers.js";
export { createReportHandlers } from "./handlers/report-handlers.js";
export { createTaxHandlers } from "./handlers/tax-handlers.js";
export { createPeriodHandlers } from "./handlers/period-handlers.js";
