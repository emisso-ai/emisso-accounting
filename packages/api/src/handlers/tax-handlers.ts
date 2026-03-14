import type { HandlerFn } from "./router.js";
import type { TaxService } from "../services/tax-service.js";
import { handleEffect } from "../core/effect/http-response.js";
import { ValidationError } from "../core/effect/app-error.js";
import { TaxQuerySchema } from "../validation/schemas.js";
import { Effect } from "effect";

export interface TaxHandlersDeps {
  taxService: TaxService;
}

export function createTaxHandlers(deps: TaxHandlersDeps) {
  const { taxService } = deps;

  function parseTaxQuery(req: Request) {
    const url = new URL(req.url);
    return TaxQuerySchema.safeParse({
      year: url.searchParams.get("year"),
      month: url.searchParams.get("month"),
      regime: url.searchParams.get("regime") ?? undefined,
      ivaRemanenteAnterior: url.searchParams.get("ivaRemanenteAnterior") ?? undefined,
    });
  }

  const getIva: HandlerFn = async (req, ctx) => {
    const query = parseTaxQuery(req);
    if (!query.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid query params", query.error.issues)),
      );
    }
    return handleEffect(
      taxService.getIva(ctx.tenantId, query.data.year, query.data.month, query.data.ivaRemanenteAnterior),
    );
  };

  const getPpm: HandlerFn = async (req, ctx) => {
    const query = parseTaxQuery(req);
    if (!query.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid query params", query.error.issues)),
      );
    }
    return handleEffect(
      taxService.getPpm(ctx.tenantId, query.data.year, query.data.month, query.data.regime ?? "14A"),
    );
  };

  const getF29: HandlerFn = async (req, ctx) => {
    const query = parseTaxQuery(req);
    if (!query.success) {
      return handleEffect(
        Effect.fail(ValidationError.fromZodErrors("Invalid query params", query.error.issues)),
      );
    }
    return handleEffect(
      taxService.getF29(
        ctx.tenantId,
        query.data.year,
        query.data.month,
        query.data.regime ?? "14A",
        query.data.ivaRemanenteAnterior,
      ),
    );
  };

  return { getIva, getPpm, getF29 };
}
