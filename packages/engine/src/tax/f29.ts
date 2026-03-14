import type { FiscalPeriod, F29Config, F29Data, JournalEntry, IvaResult, PpmResult } from "../types.js";
import { calculateIva } from "./iva.js";
import { calculatePpm } from "./ppm.js";

export function prepareF29(
  entries: JournalEntry[],
  period: FiscalPeriod,
  config: F29Config,
): F29Data {
  const iva = calculateIva(entries, period, {
    ivaRemanenteAnterior: config.ivaRemanenteAnterior,
  });

  const ppm = calculatePpm(entries, period, {
    regime: config.regime,
  });

  const totalToPay = iva.ivaDeterminado + ppm.ppmAmount;

  // F29 field mapping (simplified — key SII form codes)
  const fields: Record<string, number> = {
    // IVA section
    "91": iva.debitoFiscal,           // Debito fiscal del periodo
    "520": iva.creditoFiscal,          // Credito fiscal del periodo
    "504": iva.ivaRemanenteAnterior,   // Remanente periodo anterior
    "89": iva.ivaDeterminado,          // IVA determinado
    "77": iva.ivaRemanente,            // Remanente para periodo siguiente
    // PPM section
    "563": ppm.baseImponible,          // Base imponible
    "115": Math.round(ppm.rate * 10000), // Tasa PPM (en diezmilésimas)
    "48": ppm.ppmAmount,               // PPM del periodo
    // Total
    "91_total": totalToPay,            // Total a pagar
  };

  return {
    period,
    iva,
    ppm,
    totalToPay,
    fields,
  };
}
