import type { HandlerContext, HandlerFn } from "./router.js";
import type { AccountService } from "../services/account-service.js";
import { handleEffect, jsonResponse, createdResponse, noContentResponse } from "../core/effect/http-response.js";
import { ValidationError } from "../core/effect/app-error.js";
import { UpsertAccountSchema } from "../validation/schemas.js";
import { Effect } from "effect";

export interface AccountHandlersDeps {
  accountService: AccountService;
}

export function createAccountHandlers(deps: AccountHandlersDeps) {
  const { accountService } = deps;

  const listAccounts: HandlerFn = async (req, ctx) => {
    return handleEffect(accountService.listAccounts(ctx.tenantId));
  };

  const upsertAccount: HandlerFn = async (req, ctx) => {
    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: { _type: "ValidationError", message: "Invalid JSON body" } },
        { status: 400 },
      );
    }
    const parsed = UpsertAccountSchema.safeParse(body);
    if (!parsed.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid account data", parsed.error.issues)),
      );
    }
    return handleEffect(
      accountService.upsertAccount(ctx.tenantId, parsed.data),
      createdResponse,
    );
  };

  const deleteAccount: HandlerFn = async (req, ctx) => {
    const code = ctx.params.code!;
    return handleEffect(
      accountService.deleteAccount(ctx.tenantId, code).pipe(
        Effect.map(() => null),
      ),
      () => noContentResponse(),
    );
  };

  const seedChart: HandlerFn = async (req, ctx) => {
    return handleEffect(
      accountService.seedSiiChart(ctx.tenantId),
      createdResponse,
    );
  };

  return { listAccounts, upsertAccount, deleteAccount, seedChart };
}
