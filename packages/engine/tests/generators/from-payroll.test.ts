import { describe, it, expect } from "vitest";
import { fromPayroll } from "../../src/generators/from-payroll.js";
import type { PayrollInput } from "../../src/types.js";

function sumDebits(lines: Array<{ debit: number; credit: number }>) {
  return lines.reduce((s, l) => s + l.debit, 0);
}
function sumCredits(lines: Array<{ debit: number; credit: number }>) {
  return lines.reduce((s, l) => s + l.credit, 0);
}

describe("fromPayroll", () => {
  const payroll: PayrollInput = {
    period: "2026-03",
    date: "2026-03-28",
    sueldosBrutos: 1_000_000,
    afpEmpleador: 25_000,    // ~2.5% employer AFP
    afpTrabajador: 115_000,  // ~11.5% employee AFP
    saludEmpleador: 0,
    saludTrabajador: 70_000, // 7% employee health
    seguroCesantiaEmpleador: 24_000,  // 2.4% employer
    seguroCesantiaTrabajador: 6_000,  // 0.6% employee
    impuestoUnico: 30_000,
    totalHaberes: 1_000_000,
    totalDescuentos: 221_000, // 115,000 + 70,000 + 6,000 + 30,000
    liquidoAPagar: 779_000,   // 1,000,000 - 221,000
  };

  it("should generate a balanced entry", () => {
    const template = fromPayroll(payroll);
    expect(sumDebits(template.lines)).toBe(sumCredits(template.lines));
  });

  it("should debit Sueldos y Salarios for sueldo bruto", () => {
    const template = fromPayroll(payroll);
    const sueldosLine = template.lines.find((l) => l.accountCode === "4.3.01.001");
    expect(sueldosLine).toBeDefined();
    expect(sueldosLine!.debit).toBe(1_000_000);
  });

  it("should debit Leyes Sociales for employer contributions", () => {
    const template = fromPayroll(payroll);
    const leyesLine = template.lines.find((l) => l.accountCode === "4.3.01.003");
    expect(leyesLine).toBeDefined();
    // Employer: AFP 25,000 + Salud 0 + Cesantia 24,000 = 49,000
    expect(leyesLine!.debit).toBe(49_000);
  });

  it("should credit AFP retention for employee + employer combined", () => {
    const template = fromPayroll(payroll);
    const afpLine = template.lines.find((l) => l.accountCode === "2.1.03.002");
    expect(afpLine).toBeDefined();
    // Employee 115,000 + Employer 25,000 = 140,000
    expect(afpLine!.credit).toBe(140_000);
  });

  it("should credit Salud retention for employee + employer combined", () => {
    const template = fromPayroll(payroll);
    const saludLine = template.lines.find((l) => l.accountCode === "2.1.03.003");
    expect(saludLine).toBeDefined();
    // Employee 70,000 + Employer 0 = 70,000
    expect(saludLine!.credit).toBe(70_000);
  });

  it("should credit Cesantia retention for employee + employer combined", () => {
    const template = fromPayroll(payroll);
    const cesantiaLine = template.lines.find((l) => l.accountCode === "2.1.03.004");
    expect(cesantiaLine).toBeDefined();
    // Employee 6,000 + Employer 24,000 = 30,000
    expect(cesantiaLine!.credit).toBe(30_000);
  });

  it("should credit Impuesto Unico retention", () => {
    const template = fromPayroll(payroll);
    const impLine = template.lines.find((l) => l.accountCode === "2.1.03.001");
    expect(impLine).toBeDefined();
    expect(impLine!.credit).toBe(30_000);
  });

  it("should credit Sueldos por Pagar for liquido a pagar", () => {
    const template = fromPayroll(payroll);
    const sueldosPPLine = template.lines.find((l) => l.accountCode === "2.1.06.001");
    expect(sueldosPPLine).toBeDefined();
    expect(sueldosPPLine!.credit).toBe(779_000);
  });

  it("should include period and type in metadata", () => {
    const template = fromPayroll(payroll);
    expect(template.metadata.type).toBe("payroll");
    expect(template.metadata.period).toBe("2026-03");
    expect(template.description).toContain("remuneraciones");
  });

  it("should omit Leyes Sociales line when employer contributions are zero", () => {
    const noEmployer: PayrollInput = {
      ...payroll,
      afpEmpleador: 0,
      saludEmpleador: 0,
      seguroCesantiaEmpleador: 0,
    };
    const template = fromPayroll(noEmployer);
    const leyesLine = template.lines.find((l) => l.accountCode === "4.3.01.003");
    expect(leyesLine).toBeUndefined();
  });
});
