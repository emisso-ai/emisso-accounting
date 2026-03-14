import type { FiscalPeriod, PpmConfig, PpmResult, JournalEntry } from "../types.js";
import { filterEntriesByPeriod } from "../period-utils.js";
import { percentage } from "../money.js";

// Default PPM rates by regime
const PPM_RATES: Record<string, number> = {
  "14A": 0.25,      // 0.25% of net sales
  "14D-N3": 0.125,  // 0.125% for Pro-PYME general
  "14D-N8": 0.25,   // 0.25% for Pro-PYME transparencia
};

// Revenue account code prefixes (sales without IVA)
const REVENUE_PREFIXES = ["4.1.01"];

export function calculatePpm(
  entries: JournalEntry[],
  period: FiscalPeriod,
  config: PpmConfig,
): PpmResult {
  const periodEntries = filterEntriesByPeriod(entries, period);

  let baseImponible = 0;

  for (const entry of periodEntries) {
    for (const line of entry.lines) {
      if (REVENUE_PREFIXES.some((prefix) => line.accountCode.startsWith(prefix))) {
        // Revenue is credit-normal, so net = credits - debits
        baseImponible += line.credit - line.debit;
      }
    }
  }

  const rate = config.rate ?? PPM_RATES[config.regime] ?? 0.25;
  const ppmAmount = percentage(baseImponible, rate);

  return {
    baseImponible,
    rate,
    ppmAmount,
  };
}
