import type { JournalEntry, FiscalPeriod, AccountBalance } from "../types.js";
import { formatPeriod, filterEntriesByPeriod } from "../period-utils.js";
import { escapeXml } from "./utils.js";
import type { Chart } from "../accounts/chart.js";
import { getAccountBalancesFromEntries } from "../ledger/ledger.js";

export interface LibroMayorConfig {
  rut: string;
  razonSocial: string;
  period: FiscalPeriod;
}

export function generateLibroMayorXml(
  chart: Chart,
  entries: JournalEntry[],
  config: LibroMayorConfig,
): string {
  const { rut, razonSocial, period } = config;
  const periodStr = formatPeriod(period);

  const periodEntries = filterEntriesByPeriod(entries, period);

  // Group lines by account
  const accountEntries = new Map<string, Array<{ date: string; description: string; debit: number; credit: number }>>();

  for (const entry of periodEntries) {
    for (const line of entry.lines) {
      if (!accountEntries.has(line.accountCode)) {
        accountEntries.set(line.accountCode, []);
      }
      accountEntries.get(line.accountCode)!.push({
        date: entry.date,
        description: entry.description,
        debit: line.debit,
        credit: line.credit,
      });
    }
  }

  const balances = getAccountBalancesFromEntries(chart, periodEntries);

  let xml = `<?xml version="1.0" encoding="ISO-8859-1"?>\n`;
  xml += `<LibroMayor>\n`;
  xml += `  <Caratula>\n`;
  xml += `    <RutEmpresa>${rut}</RutEmpresa>\n`;
  xml += `    <RazonSocial>${escapeXml(razonSocial)}</RazonSocial>\n`;
  xml += `    <Periodo>${periodStr}</Periodo>\n`;
  xml += `    <TotalCuentas>${accountEntries.size}</TotalCuentas>\n`;
  xml += `  </Caratula>\n`;

  const sortedCodes = Array.from(accountEntries.keys()).sort();

  for (const code of sortedCodes) {
    const account = chart.getAccount(code);
    const movements = accountEntries.get(code)!;
    const balance = balances.find((b) => b.accountCode === code);

    xml += `  <Cuenta>\n`;
    xml += `    <CodigoCuenta>${code}</CodigoCuenta>\n`;
    xml += `    <NombreCuenta>${escapeXml(account?.name ?? code)}</NombreCuenta>\n`;

    for (const mov of movements) {
      xml += `    <Movimiento>\n`;
      xml += `      <Fecha>${mov.date}</Fecha>\n`;
      xml += `      <Glosa>${escapeXml(mov.description)}</Glosa>\n`;
      if (mov.debit > 0) xml += `      <MontoDebe>${mov.debit}</MontoDebe>\n`;
      if (mov.credit > 0) xml += `      <MontoHaber>${mov.credit}</MontoHaber>\n`;
      xml += `    </Movimiento>\n`;
    }

    xml += `    <SaldoDeudor>${balance?.debit ?? 0}</SaldoDeudor>\n`;
    xml += `    <SaldoAcreedor>${balance?.credit ?? 0}</SaldoAcreedor>\n`;
    xml += `  </Cuenta>\n`;
  }

  xml += `</LibroMayor>`;
  return xml;
}
