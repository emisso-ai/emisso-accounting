import type { FiscalPeriod, IvaResult, JournalEntry } from "../types.js";
import { filterEntriesByPeriod } from "../period-utils.js";

// IVA Credito Fiscal account codes (from SII chart)
const IVA_CF_CODES = ["1.1.06.001"];
// IVA Debito Fiscal account codes
const IVA_DF_CODES = ["2.1.02.001"];

export function calculateIva(
  entries: JournalEntry[],
  period: FiscalPeriod,
  options?: { ivaRemanenteAnterior?: number },
): IvaResult {
  const periodEntries = filterEntriesByPeriod(entries, period);

  let debitoFiscal = 0;
  let creditoFiscal = 0;

  for (const entry of periodEntries) {
    for (const line of entry.lines) {
      if (IVA_DF_CODES.includes(line.accountCode)) {
        // IVA DF is a liability — credits increase it
        debitoFiscal += line.credit - line.debit;
      }
      if (IVA_CF_CODES.includes(line.accountCode)) {
        // IVA CF is an asset — debits increase it
        creditoFiscal += line.debit - line.credit;
      }
    }
  }

  const ivaRemanenteAnterior = options?.ivaRemanenteAnterior ?? 0;
  const totalCF = creditoFiscal + ivaRemanenteAnterior;

  // IVA determinado = DF - CF total
  // If positive: tax to pay. If negative: remanente for next period.
  const ivaDeterminado = debitoFiscal - totalCF;
  const ivaRemanente = ivaDeterminado < 0 ? Math.abs(ivaDeterminado) : 0;

  return {
    debitoFiscal,
    creditoFiscal,
    ivaRemanenteAnterior,
    ivaDeterminado: Math.max(0, ivaDeterminado),
    ivaRemanente,
  };
}
