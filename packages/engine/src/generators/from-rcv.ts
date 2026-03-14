import type { RcvInput, EntryTemplate } from "../types.js";
import { DEFAULT_ACCOUNT_CODES as ACCOUNTS } from "./account-codes.js";

export function fromRcv(record: RcvInput): EntryTemplate {
  if (record.type === "venta") {
    const lines: Array<{ accountCode: string; debit: number; credit: number }> = [];

    lines.push({ accountCode: ACCOUNTS.clientes, debit: record.total, credit: 0 });
    if (record.neto > 0) {
      lines.push({ accountCode: ACCOUNTS.ventas, debit: 0, credit: record.neto });
    }
    if (record.exento > 0) {
      lines.push({ accountCode: ACCOUNTS.ventas, debit: 0, credit: record.exento });
    }
    if (record.iva > 0) {
      lines.push({ accountCode: ACCOUNTS.ivaDF, debit: 0, credit: record.iva });
    }

    return {
      description: `RCV Venta ${record.documentType} N° ${record.folio} - ${record.razonSocial}`,
      lines,
      metadata: {
        source: "rcv",
        type: "venta",
        documentType: record.documentType,
        folio: record.folio,
        rut: record.rut,
        razonSocial: record.razonSocial,
      },
    };
  }

  // Compra
  const lines: Array<{ accountCode: string; debit: number; credit: number }> = [];

  if (record.neto > 0) {
    lines.push({ accountCode: ACCOUNTS.costoMercaderias, debit: record.neto, credit: 0 });
  }
  if (record.exento > 0) {
    lines.push({ accountCode: ACCOUNTS.costoMercaderias, debit: record.exento, credit: 0 });
  }
  if (record.iva > 0) {
    lines.push({ accountCode: ACCOUNTS.ivaCF, debit: record.iva, credit: 0 });
  }
  lines.push({ accountCode: ACCOUNTS.proveedores, debit: 0, credit: record.total });

  return {
    description: `RCV Compra ${record.documentType} N° ${record.folio} - ${record.razonSocial}`,
    lines,
    metadata: {
      source: "rcv",
      type: "compra",
      documentType: record.documentType,
      folio: record.folio,
      rut: record.rut,
      razonSocial: record.razonSocial,
    },
  };
}
