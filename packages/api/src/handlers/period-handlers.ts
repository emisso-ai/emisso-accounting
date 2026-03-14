import type { HandlerFn } from "./router.js";
import type { PeriodService } from "../services/period-service.js";
import { handleEffect, createdResponse } from "../core/effect/http-response.js";
import { ValidationError } from "../core/effect/app-error.js";
import { OpenPeriodSchema, UpdatePeriodSchema } from "../validation/schemas.js";
import { Effect } from "effect";

export interface PeriodHandlersDeps {
  periodService: PeriodService;
}

export function createPeriodHandlers(deps: PeriodHandlersDeps) {
  const { periodService } = deps;

  const listPeriods: HandlerFn = async (req, ctx) => {
    return handleEffect(periodService.listPeriods(ctx.tenantId));
  };

  const openPeriod: HandlerFn = async (req, ctx) => {
    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: { _type: "ValidationError", message: "Invalid JSON body" } },
        { status: 400 },
      );
    }
    const parsed = OpenPeriodSchema.safeParse(body);
    if (!parsed.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid period data", parsed.error.issues)),
      );
    }
    return handleEffect(
      periodService.openPeriod(ctx.tenantId, parsed.data.year, parsed.data.month),
      createdResponse,
    );
  };

  const updatePeriod: HandlerFn = async (req, ctx) => {
    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: { _type: "ValidationError", message: "Invalid JSON body" } },
        { status: 400 },
      );
    }
    const parsed = UpdatePeriodSchema.safeParse(body);
    if (!parsed.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid period update", parsed.error.issues)),
      );
    }
    const { year, month, status } = parsed.data;
    const effect = status === "closed"
      ? periodService.closePeriod(ctx.tenantId, year, month)
      : periodService.lockPeriod(ctx.tenantId, year, month);
    return handleEffect(effect);
  };

  return { listPeriods, openPeriod, updatePeriod };
}
