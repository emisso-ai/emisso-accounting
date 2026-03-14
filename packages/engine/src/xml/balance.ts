import type { Balance8Columnas, FiscalPeriod } from "../types.js";
import { formatPeriod } from "../period-utils.js";
import { escapeXml } from "./utils.js";

export interface BalanceXmlConfig {
  rut: string;
  razonSocial: string;
  period: FiscalPeriod;
}

export function generateBalanceXml(
  data: Balance8Columnas,
  config: BalanceXmlConfig,
): string {
  const { rut, razonSocial, period } = config;
  const periodStr = formatPeriod(period);

  let xml = `<?xml version="1.0" encoding="ISO-8859-1"?>\n`;
  xml += `<Balance8Columnas>\n`;
  xml += `  <Caratula>\n`;
  xml += `    <RutEmpresa>${rut}</RutEmpresa>\n`;
  xml += `    <RazonSocial>${escapeXml(razonSocial)}</RazonSocial>\n`;
  xml += `    <Periodo>${periodStr}</Periodo>\n`;
  xml += `    <TotalCuentas>${data.rows.length}</TotalCuentas>\n`;
  xml += `  </Caratula>\n`;

  for (const row of data.rows) {
    xml += `  <Cuenta>\n`;
    xml += `    <CodigoCuenta>${row.accountCode}</CodigoCuenta>\n`;
    xml += `    <NombreCuenta>${escapeXml(row.accountName)}</NombreCuenta>\n`;
    xml += `    <DebitosMes>${row.debitMovement}</DebitosMes>\n`;
    xml += `    <CreditosMes>${row.creditMovement}</CreditosMes>\n`;
    xml += `    <SaldoDeudor>${row.debitBalance}</SaldoDeudor>\n`;
    xml += `    <SaldoAcreedor>${row.creditBalance}</SaldoAcreedor>\n`;
    xml += `    <Activo>${row.activo}</Activo>\n`;
    xml += `    <Pasivo>${row.pasivo}</Pasivo>\n`;
    xml += `    <Perdida>${row.perdida}</Perdida>\n`;
    xml += `    <Ganancia>${row.ganancia}</Ganancia>\n`;
    xml += `  </Cuenta>\n`;
  }

  xml += `  <Totales>\n`;
  xml += `    <DebitosMes>${data.totals.debitMovement}</DebitosMes>\n`;
  xml += `    <CreditosMes>${data.totals.creditMovement}</CreditosMes>\n`;
  xml += `    <SaldoDeudor>${data.totals.debitBalance}</SaldoDeudor>\n`;
  xml += `    <SaldoAcreedor>${data.totals.creditBalance}</SaldoAcreedor>\n`;
  xml += `    <Activo>${data.totals.activo}</Activo>\n`;
  xml += `    <Pasivo>${data.totals.pasivo}</Pasivo>\n`;
  xml += `    <Perdida>${data.totals.perdida}</Perdida>\n`;
  xml += `    <Ganancia>${data.totals.ganancia}</Ganancia>\n`;
  xml += `  </Totales>\n`;
  xml += `</Balance8Columnas>`;

  return xml;
}
