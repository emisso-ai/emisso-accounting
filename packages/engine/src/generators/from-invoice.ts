import type { InvoiceInput, EntryTemplate } from "../types.js";
import { DEFAULT_ACCOUNT_CODES as ACCOUNTS } from "./account-codes.js";

function getReceivableAccount(paymentMethod?: string): string {
  switch (paymentMethod) {
    case "efectivo": return ACCOUNTS.caja;
    case "banco": return ACCOUNTS.banco;
    default: return ACCOUNTS.clientes;
  }
}

function getPayableAccount(paymentMethod?: string): string {
  switch (paymentMethod) {
    case "efectivo": return ACCOUNTS.caja;
    case "banco": return ACCOUNTS.banco;
    default: return ACCOUNTS.proveedores;
  }
}

export function fromInvoice(invoice: InvoiceInput): EntryTemplate {
  if (invoice.type === "venta") {
    const lines: Array<{ accountCode: string; debit: number; credit: number }> = [];
    const receivableCode = getReceivableAccount(invoice.paymentMethod);

    lines.push({ accountCode: receivableCode, debit: invoice.total, credit: 0 });
    lines.push({ accountCode: ACCOUNTS.ventas, debit: 0, credit: invoice.neto });
    if (invoice.iva > 0) {
      lines.push({ accountCode: ACCOUNTS.ivaDF, debit: 0, credit: invoice.iva });
    }
    if (invoice.exento && invoice.exento > 0) {
      // Exento amount is already part of neto for exempt items
      // No additional line needed — it's in the ventas credit
    }

    return {
      description: `Venta factura N° ${invoice.folio}`,
      lines,
      metadata: {
        documentType: "factura",
        type: "venta",
        folio: invoice.folio,
        date: invoice.date,
      },
    };
  }

  // Compra
  const lines: Array<{ accountCode: string; debit: number; credit: number }> = [];
  const payableCode = getPayableAccount(invoice.paymentMethod);

  lines.push({ accountCode: ACCOUNTS.costoMercaderias, debit: invoice.neto, credit: 0 });
  if (invoice.iva > 0) {
    lines.push({ accountCode: ACCOUNTS.ivaCF, debit: invoice.iva, credit: 0 });
  }
  lines.push({ accountCode: payableCode, debit: 0, credit: invoice.total });

  return {
    description: `Compra factura N° ${invoice.folio}`,
    lines,
    metadata: {
      documentType: "factura",
      type: "compra",
      folio: invoice.folio,
      date: invoice.date,
    },
  };
}
