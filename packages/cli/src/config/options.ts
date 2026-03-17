/**
 * Shared CLI option definitions — imported by all commands
 */

import { Options } from "@effect/cli";

export const ledgerOption = Options.text("ledger").pipe(
  Options.optional,
  Options.withDescription("Path to ledger JSON file"),
);

export const periodOption = Options.text("period").pipe(
  Options.withDescription("Period in YYYY-MM format"),
);

export const regimeOption = Options.text("regime").pipe(
  Options.optional,
  Options.withDescription("Tax regime: 14A, 14D-N3, or 14D-N8"),
);

export const rutOption = Options.text("rut").pipe(
  Options.optional,
  Options.withDescription("Company RUT"),
);

export const razonSocialOption = Options.text("razon-social").pipe(
  Options.optional,
  Options.withDescription("Company name (razón social)"),
);

export const remanenteOption = Options.integer("remanente").pipe(
  Options.optional,
  Options.withDescription("IVA remanente from previous period (CLP)"),
);
