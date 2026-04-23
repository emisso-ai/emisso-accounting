/**
 * accounting doctor — check environment and dependencies
 */

import { Command } from "@effect/cli";
import { Effect } from "effect";
import {
  OutputRenderer,
  resolveFormat,
  formatOption,
  jsonFlag,
} from "@emisso/cli-core";
import { keyValueColumns } from "../formatters/accounting-table.js";

const options = { format: formatOption, json: jsonFlag };

function tryRequireVersion(pkg: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const p = require(`${pkg}/package.json`);
    return `${p.version} ✓`;
  } catch {
    return "installed ✓";
  }
}

export const doctorCommand = Command.make(
  "doctor",
  options,
  ({ format, json }) =>
    Effect.gen(function* () {
      const renderer = yield* OutputRenderer;
      const resolvedFormat = resolveFormat(format, json);

      const checks: Array<{ field: string; value: string }> = [
        { field: "Node.js", value: `${process.version} ✓` },
        { field: "@emisso/accounting", value: tryRequireVersion("@emisso/accounting") },
        { field: "@emisso/cli-core", value: tryRequireVersion("@emisso/cli-core") },
        { field: "ACCOUNTING_LEDGER", value: process.env["ACCOUNTING_LEDGER"] ? `${process.env["ACCOUNTING_LEDGER"]} ✓` : "not set" },
        { field: "ACCOUNTING_REGIME", value: process.env["ACCOUNTING_REGIME"] ? `${process.env["ACCOUNTING_REGIME"]} ✓` : "not set" },
        { field: "ACCOUNTING_RUT", value: process.env["ACCOUNTING_RUT"] ? `${process.env["ACCOUNTING_RUT"]} ✓` : "not set" },
      ];

      yield* renderer.render(checks, {
        columns: keyValueColumns,
        ttyDefault: "table",
      }, { format: resolvedFormat });
    }),
).pipe(Command.withDescription("Check environment and dependencies"));
