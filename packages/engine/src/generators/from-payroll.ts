import type { PayrollInput, EntryTemplate } from "../types.js";
import { DEFAULT_ACCOUNT_CODES as ACCOUNTS } from "./account-codes.js";

export function fromPayroll(liquidacion: PayrollInput): EntryTemplate {
  const lines: Array<{ accountCode: string; debit: number; credit: number }> = [];

  // Expense: Sueldos y Salarios (total bruto)
  lines.push({
    accountCode: ACCOUNTS.sueldosSalarios,
    debit: liquidacion.sueldosBrutos,
    credit: 0,
  });

  // Expense: Leyes sociales (employer portion of AFP, health, cesantia)
  const leyesSociales = liquidacion.afpEmpleador + liquidacion.saludEmpleador + liquidacion.seguroCesantiaEmpleador;
  if (leyesSociales > 0) {
    lines.push({
      accountCode: ACCOUNTS.leyesSociales,
      debit: leyesSociales,
      credit: 0,
    });
  }

  // Liability: Retenciones (employee deductions held as payables)
  if (liquidacion.afpTrabajador > 0) {
    lines.push({
      accountCode: ACCOUNTS.retencionAFP,
      debit: 0,
      credit: liquidacion.afpTrabajador + liquidacion.afpEmpleador,
    });
  }
  if (liquidacion.saludTrabajador > 0) {
    lines.push({
      accountCode: ACCOUNTS.retencionSalud,
      debit: 0,
      credit: liquidacion.saludTrabajador + liquidacion.saludEmpleador,
    });
  }
  if (liquidacion.seguroCesantiaTrabajador > 0) {
    lines.push({
      accountCode: ACCOUNTS.retencionCesantia,
      debit: 0,
      credit: liquidacion.seguroCesantiaTrabajador + liquidacion.seguroCesantiaEmpleador,
    });
  }
  if (liquidacion.impuestoUnico > 0) {
    lines.push({
      accountCode: ACCOUNTS.retencionImpuesto,
      debit: 0,
      credit: liquidacion.impuestoUnico,
    });
  }

  // Liability: Sueldos por Pagar (net pay)
  lines.push({
    accountCode: ACCOUNTS.sueldosPorPagar,
    debit: 0,
    credit: liquidacion.liquidoAPagar,
  });

  return {
    description: `Provision remuneraciones ${liquidacion.period}`,
    lines,
    metadata: {
      type: "payroll",
      period: liquidacion.period,
      date: liquidacion.date,
    },
  };
}
