import type { JournalEntry, FiscalPeriod } from "../types.js";
import { formatPeriod, filterEntriesByPeriod } from "../period-utils.js";
import { escapeXml } from "./utils.js";

export interface LibroDiarioConfig {
  rut: string;
  razonSocial: string;
  period: FiscalPeriod;
  resolucion?: { numero: number; fecha: string };
}

export function generateLibroDiarioXml(
  entries: JournalEntry[],
  config: LibroDiarioConfig,
): string {
  const { rut, razonSocial, period } = config;
  const periodStr = formatPeriod(period);

  // Filter entries for the period
  const periodEntries = filterEntriesByPeriod(entries, period);

  let xml = `<?xml version="1.0" encoding="ISO-8859-1"?>\n`;
  xml += `<LibroDiario>\n`;
  xml += `  <Caratula>\n`;
  xml += `    <RutEmpresa>${rut}</RutEmpresa>\n`;
  xml += `    <RazonSocial>${escapeXml(razonSocial)}</RazonSocial>\n`;
  xml += `    <Periodo>${periodStr}</Periodo>\n`;
  if (config.resolucion) {
    xml += `    <NumeroResolucion>${config.resolucion.numero}</NumeroResolucion>\n`;
    xml += `    <FechaResolucion>${config.resolucion.fecha}</FechaResolucion>\n`;
  }
  xml += `    <TotalRegistros>${periodEntries.length}</TotalRegistros>\n`;
  xml += `  </Caratula>\n`;

  for (const entry of periodEntries) {
    xml += `  <Detalle>\n`;
    xml += `    <NumeroAsiento>${entry.id}</NumeroAsiento>\n`;
    xml += `    <Fecha>${entry.date}</Fecha>\n`;
    xml += `    <Glosa>${escapeXml(entry.description)}</Glosa>\n`;
    for (const line of entry.lines) {
      xml += `    <Movimiento>\n`;
      xml += `      <CuentaContable>${line.accountCode}</CuentaContable>\n`;
      if (line.debit > 0) {
        xml += `      <MontoDebe>${line.debit}</MontoDebe>\n`;
      }
      if (line.credit > 0) {
        xml += `      <MontoHaber>${line.credit}</MontoHaber>\n`;
      }
      xml += `    </Movimiento>\n`;
    }
    xml += `  </Detalle>\n`;
  }

  // Resumen
  let totalDebe = 0;
  let totalHaber = 0;
  for (const entry of periodEntries) {
    for (const line of entry.lines) {
      totalDebe += line.debit;
      totalHaber += line.credit;
    }
  }
  xml += `  <Resumen>\n`;
  xml += `    <TotalDebe>${totalDebe}</TotalDebe>\n`;
  xml += `    <TotalHaber>${totalHaber}</TotalHaber>\n`;
  xml += `  </Resumen>\n`;
  xml += `</LibroDiario>`;

  return xml;
}
