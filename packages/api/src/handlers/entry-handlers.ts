import type { HandlerFn } from "./router.js";
import type { LedgerService } from "../services/ledger-service.js";
import { handleEffect, createdResponse } from "../core/effect/http-response.js";
import { ValidationError } from "../core/effect/app-error.js";
import { CreateEntrySchema, VoidEntrySchema, ListEntriesQuerySchema } from "../validation/schemas.js";
import { Effect } from "effect";

export interface EntryHandlersDeps {
  ledgerService: LedgerService;
}

export function createEntryHandlers(deps: EntryHandlersDeps) {
  const { ledgerService } = deps;

  const createEntry: HandlerFn = async (req, ctx) => {
    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: { _type: "ValidationError", message: "Invalid JSON body" } },
        { status: 400 },
      );
    }
    const parsed = CreateEntrySchema.safeParse(body);
    if (!parsed.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid entry data", parsed.error.issues)),
      );
    }
    return handleEffect(
      ledgerService.createEntry(ctx.tenantId, parsed.data),
      createdResponse,
    );
  };

  const listEntries: HandlerFn = async (req, ctx) => {
    const url = new URL(req.url);
    const query = ListEntriesQuerySchema.safeParse({
      year: url.searchParams.get("year"),
      month: url.searchParams.get("month"),
    });
    if (!query.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid query params", query.error.issues)),
      );
    }
    return handleEffect(
      ledgerService.listEntries(ctx.tenantId, query.data.year, query.data.month),
    );
  };

  const voidEntry: HandlerFn = async (req, ctx) => {
    const entryId = ctx.params.entryId!;
    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: { _type: "ValidationError", message: "Invalid JSON body" } },
        { status: 400 },
      );
    }
    const parsed = VoidEntrySchema.safeParse(body);
    if (!parsed.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid void data", parsed.error.issues)),
      );
    }
    return handleEffect(
      ledgerService.voidEntry(ctx.tenantId, entryId, parsed.data.reason),
      createdResponse,
    );
  };

  return { createEntry, listEntries, voidEntry };
}
