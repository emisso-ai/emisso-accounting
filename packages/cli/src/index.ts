/**
 * Root command composition for @emisso/accounting-cli
 */

import { Command } from "@effect/cli";

// Chart commands
import { chartListCommand } from "./commands/chart/list.js";
import { chartSeedCommand } from "./commands/chart/seed.js";
import { chartShowCommand } from "./commands/chart/show.js";

// Entry commands
import { entryAddCommand } from "./commands/entry/add.js";
import { entryListCommand } from "./commands/entry/list.js";
import { entryShowCommand } from "./commands/entry/show.js";
import { entryVoidCommand } from "./commands/entry/void.js";

// Import commands
import { importInvoiceCommand } from "./commands/import/invoice.js";
import { importPayrollCommand } from "./commands/import/payroll.js";
import { importRcvCommand } from "./commands/import/rcv.js";

// Report commands
import { reportTrialBalanceCommand } from "./commands/report/trial-balance.js";
import { reportBalance8Command } from "./commands/report/balance-8-columnas.js";
import { reportIncomeStatementCommand } from "./commands/report/income-statement.js";
import { reportBalanceSheetCommand } from "./commands/report/balance-sheet.js";

// Tax commands
import { taxIvaCommand } from "./commands/tax/iva.js";
import { taxPpmCommand } from "./commands/tax/ppm.js";
import { taxF29Command } from "./commands/tax/f29.js";

// XML commands
import { xmlLibroDiarioCommand } from "./commands/xml/libro-diario.js";
import { xmlLibroMayorCommand } from "./commands/xml/libro-mayor.js";
import { xmlBalanceCommand } from "./commands/xml/balance.js";

// Period commands
import { periodListCommand } from "./commands/period/list.js";
import { periodOpenCommand } from "./commands/period/open.js";
import { periodCloseCommand } from "./commands/period/close.js";
import { periodLockCommand } from "./commands/period/lock.js";

// Doctor
import { doctorCommand } from "./commands/doctor.js";

/* ── Subcommand groups ─────────────────────────────────────────── */

const chartCommand = Command.make("chart").pipe(
  Command.withDescription("Chart of accounts management"),
  Command.withSubcommands([chartListCommand, chartSeedCommand, chartShowCommand]),
);

const entryCommand = Command.make("entry").pipe(
  Command.withDescription("Journal entry operations"),
  Command.withSubcommands([entryAddCommand, entryListCommand, entryShowCommand, entryVoidCommand]),
);

const importCommand = Command.make("import").pipe(
  Command.withDescription("Import documents as journal entries"),
  Command.withSubcommands([importInvoiceCommand, importPayrollCommand, importRcvCommand]),
);

const reportCommand = Command.make("report").pipe(
  Command.withDescription("Financial reports"),
  Command.withSubcommands([
    reportTrialBalanceCommand,
    reportBalance8Command,
    reportIncomeStatementCommand,
    reportBalanceSheetCommand,
  ]),
);

const taxCommand = Command.make("tax").pipe(
  Command.withDescription("Tax calculations and forms"),
  Command.withSubcommands([taxIvaCommand, taxPpmCommand, taxF29Command]),
);

const xmlCommand = Command.make("xml").pipe(
  Command.withDescription("Generate SII XML files"),
  Command.withSubcommands([xmlLibroDiarioCommand, xmlLibroMayorCommand, xmlBalanceCommand]),
);

const periodCommand = Command.make("period").pipe(
  Command.withDescription("Period management"),
  Command.withSubcommands([periodListCommand, periodOpenCommand, periodCloseCommand, periodLockCommand]),
);

/* ── Root command ──────────────────────────────────────────────── */

export const rootCommand = Command.make("accounting").pipe(
  Command.withDescription("Emisso Accounting CLI — double-entry bookkeeping for Chilean businesses"),
  Command.withSubcommands([
    chartCommand,
    entryCommand,
    importCommand,
    reportCommand,
    taxCommand,
    xmlCommand,
    periodCommand,
    doctorCommand,
  ]),
);
