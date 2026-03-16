/**
 * accounting period list — list periods with their status
 */

import { Command } from "@effect/cli";
import { Effect } from "effect";
import { formatPeriod } from "@emisso/accounting";
import {
  OutputRenderer,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { periodColumns } from "../../formatters/accounting-table.js";
import { ledgerOption } from "../../config/options.js";
import { resolveLedgerPathEffect } from "../../config/resolve.js";
import { loadLedgerEffect } from "../../config/ledger-io.js";

const options = {
  ledger: ledgerOption,
  format: formatOption,
  json: jsonFlag,
};

export const periodListCommand = Command.make(
  "list",
  options,
  ({ ledger, format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const ledgerPath = yield* resolveLedgerPathEffect({ ledger });

      const l = yield* loadLedgerEffect(ledgerPath);

      const entries = l.getEntries({});
      const periodsSet = new Set<string>();
      for (const entry of entries) {
        const [y, m] = entry.date.split("-");
        periodsSet.add(`${y}-${m}`);
      }

      const rows = Array.from(periodsSet).sort().map((p) => {
        const [y, m] = p.split("-").map(Number);
        const period = l.periods.getPeriod(y, m);
        return {
          period: formatPeriod({ year: y, month: m }),
          status: period.status,
          closedAt: period.closedAt ?? "",
          lockedAt: period.lockedAt ?? "",
        };
      });

      yield* renderer.render(rows, {
        columns: periodColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("List accounting periods with status"));
