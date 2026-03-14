import type { Account } from "../types.js";
import { type Chart, createChart } from "./chart.js";

// ---------------------------------------------------------------------------
// Standard SII Chart of Accounts for Chilean businesses
// ---------------------------------------------------------------------------

export const siiAccounts: Account[] = [
  // =========================================================================
  // 1 — Activo
  // =========================================================================
  { code: "1", name: "Activo", type: "asset" },

  // 1.1 — Activo Circulante
  { code: "1.1", name: "Activo Circulante", type: "asset", parentCode: "1" },

  { code: "1.1.01", name: "Caja", type: "asset", parentCode: "1.1" },
  { code: "1.1.01.001", name: "Caja General", type: "asset", parentCode: "1.1.01" },

  { code: "1.1.02", name: "Banco", type: "asset", parentCode: "1.1" },
  { code: "1.1.02.001", name: "Banco Cuenta Corriente", type: "asset", parentCode: "1.1.02" },

  { code: "1.1.03", name: "Clientes", type: "asset", parentCode: "1.1" },
  { code: "1.1.03.001", name: "Clientes Nacionales", type: "asset", parentCode: "1.1.03" },

  { code: "1.1.04", name: "Documentos por Cobrar", type: "asset", parentCode: "1.1" },
  { code: "1.1.04.001", name: "Letras por Cobrar", type: "asset", parentCode: "1.1.04" },

  { code: "1.1.05", name: "Deudores Varios", type: "asset", parentCode: "1.1" },

  { code: "1.1.06", name: "IVA Credito Fiscal", type: "asset", parentCode: "1.1" },
  { code: "1.1.06.001", name: "IVA Credito Fiscal", type: "asset", parentCode: "1.1.06" },

  { code: "1.1.07", name: "PPM por Recuperar", type: "asset", parentCode: "1.1" },
  { code: "1.1.07.001", name: "PPM por Recuperar", type: "asset", parentCode: "1.1.07" },

  { code: "1.1.08", name: "Existencias", type: "asset", parentCode: "1.1" },
  { code: "1.1.08.001", name: "Mercaderias", type: "asset", parentCode: "1.1.08" },
  { code: "1.1.08.002", name: "Materias Primas", type: "asset", parentCode: "1.1.08" },

  { code: "1.1.09", name: "Impuestos por Recuperar", type: "asset", parentCode: "1.1" },

  // 1.2 — Activos Fijos
  { code: "1.2", name: "Activos Fijos", type: "asset", parentCode: "1" },

  { code: "1.2.01", name: "Terrenos", type: "asset", parentCode: "1.2" },
  { code: "1.2.02", name: "Edificios", type: "asset", parentCode: "1.2" },
  { code: "1.2.03", name: "Maquinaria y Equipos", type: "asset", parentCode: "1.2" },
  { code: "1.2.04", name: "Vehiculos", type: "asset", parentCode: "1.2" },
  { code: "1.2.05", name: "Muebles y Utiles", type: "asset", parentCode: "1.2" },
  { code: "1.2.06", name: "Equipos de Computacion", type: "asset", parentCode: "1.2" },

  { code: "1.2.07", name: "Depreciacion Acumulada", type: "asset", parentCode: "1.2" },
  { code: "1.2.07.001", name: "Dep. Acum. Edificios", type: "asset", parentCode: "1.2.07" },
  { code: "1.2.07.002", name: "Dep. Acum. Maquinaria", type: "asset", parentCode: "1.2.07" },
  { code: "1.2.07.003", name: "Dep. Acum. Vehiculos", type: "asset", parentCode: "1.2.07" },
  { code: "1.2.07.004", name: "Dep. Acum. Muebles", type: "asset", parentCode: "1.2.07" },
  { code: "1.2.07.005", name: "Dep. Acum. Eq. Computacion", type: "asset", parentCode: "1.2.07" },

  // 1.3 — Otros Activos
  { code: "1.3", name: "Otros Activos", type: "asset", parentCode: "1" },

  { code: "1.3.01", name: "Inversiones en Empresas Relacionadas", type: "asset", parentCode: "1.3" },
  { code: "1.3.02", name: "Activos Intangibles", type: "asset", parentCode: "1.3" },
  { code: "1.3.03", name: "Gastos Diferidos", type: "asset", parentCode: "1.3" },

  // =========================================================================
  // 2 — Pasivo
  // =========================================================================
  { code: "2", name: "Pasivo", type: "liability" },

  // 2.1 — Pasivo Circulante
  { code: "2.1", name: "Pasivo Circulante", type: "liability", parentCode: "2" },

  { code: "2.1.01", name: "Proveedores", type: "liability", parentCode: "2.1" },
  { code: "2.1.01.001", name: "Proveedores Nacionales", type: "liability", parentCode: "2.1.01" },

  { code: "2.1.02", name: "IVA Debito Fiscal", type: "liability", parentCode: "2.1" },
  { code: "2.1.02.001", name: "IVA Debito Fiscal", type: "liability", parentCode: "2.1.02" },

  { code: "2.1.03", name: "Retenciones por Pagar", type: "liability", parentCode: "2.1" },
  { code: "2.1.03.001", name: "Retencion Impuesto Unico", type: "liability", parentCode: "2.1.03" },
  { code: "2.1.03.002", name: "Retencion AFP", type: "liability", parentCode: "2.1.03" },
  { code: "2.1.03.003", name: "Retencion Salud", type: "liability", parentCode: "2.1.03" },
  { code: "2.1.03.004", name: "Retencion Seguro Cesantia", type: "liability", parentCode: "2.1.03" },

  { code: "2.1.04", name: "IVA por Pagar", type: "liability", parentCode: "2.1" },
  { code: "2.1.04.001", name: "IVA por Pagar", type: "liability", parentCode: "2.1.04" },

  { code: "2.1.05", name: "PPM por Pagar", type: "liability", parentCode: "2.1" },
  { code: "2.1.05.001", name: "PPM por Pagar", type: "liability", parentCode: "2.1.05" },

  { code: "2.1.06", name: "Remuneraciones por Pagar", type: "liability", parentCode: "2.1" },
  { code: "2.1.06.001", name: "Sueldos por Pagar", type: "liability", parentCode: "2.1.06" },

  { code: "2.1.07", name: "Impuestos por Pagar", type: "liability", parentCode: "2.1" },
  { code: "2.1.07.001", name: "Impuesto Renta por Pagar", type: "liability", parentCode: "2.1.07" },

  { code: "2.1.08", name: "Documentos por Pagar (CP)", type: "liability", parentCode: "2.1" },
  { code: "2.1.09", name: "Acreedores Varios", type: "liability", parentCode: "2.1" },
  { code: "2.1.10", name: "Provisiones", type: "liability", parentCode: "2.1" },

  // 2.2 — Pasivo a Largo Plazo
  { code: "2.2", name: "Pasivo a Largo Plazo", type: "liability", parentCode: "2" },

  { code: "2.2.01", name: "Prestamos Bancarios LP", type: "liability", parentCode: "2.2" },
  { code: "2.2.02", name: "Documentos por Pagar LP", type: "liability", parentCode: "2.2" },
  { code: "2.2.03", name: "Otros Pasivos LP", type: "liability", parentCode: "2.2" },

  // =========================================================================
  // 3 — Patrimonio
  // =========================================================================
  { code: "3", name: "Patrimonio", type: "equity" },

  // 3.1 — Capital
  { code: "3.1", name: "Capital", type: "equity", parentCode: "3" },

  { code: "3.1.01", name: "Capital Pagado", type: "equity", parentCode: "3.1" },
  { code: "3.1.01.001", name: "Capital Social", type: "equity", parentCode: "3.1.01" },

  { code: "3.1.02", name: "Reservas", type: "equity", parentCode: "3.1" },
  { code: "3.1.02.001", name: "Reserva Legal", type: "equity", parentCode: "3.1.02" },

  { code: "3.1.03", name: "Revalorizacion Capital Propio", type: "equity", parentCode: "3.1" },
  { code: "3.1.03.001", name: "Revalorizacion Capital Propio", type: "equity", parentCode: "3.1.03" },

  // 3.2 — Resultados
  { code: "3.2", name: "Resultados", type: "equity", parentCode: "3" },

  { code: "3.2.01", name: "Resultado del Ejercicio", type: "equity", parentCode: "3.2" },
  { code: "3.2.01.001", name: "Utilidad del Ejercicio", type: "equity", parentCode: "3.2.01" },
  { code: "3.2.01.002", name: "Perdida del Ejercicio", type: "equity", parentCode: "3.2.01" },

  { code: "3.2.02", name: "Resultados Acumulados", type: "equity", parentCode: "3.2" },
  { code: "3.2.02.001", name: "Utilidades Retenidas", type: "equity", parentCode: "3.2.02" },
  { code: "3.2.02.002", name: "Perdidas Acumuladas", type: "equity", parentCode: "3.2.02" },

  // =========================================================================
  // 4 — Cuentas de Resultado
  // =========================================================================
  { code: "4", name: "Cuentas de Resultado", type: "revenue" },

  // 4.1 — Ingresos de Explotacion
  { code: "4.1", name: "Ingresos de Explotacion", type: "revenue", parentCode: "4" },

  { code: "4.1.01", name: "Ventas", type: "revenue", parentCode: "4.1" },
  { code: "4.1.01.001", name: "Ventas Nacionales", type: "revenue", parentCode: "4.1.01" },
  { code: "4.1.01.002", name: "Ventas Exportacion", type: "revenue", parentCode: "4.1.01" },

  { code: "4.1.02", name: "Otros Ingresos de Explotacion", type: "revenue", parentCode: "4.1" },

  // 4.2 — Costos de Explotacion
  { code: "4.2", name: "Costos de Explotacion", type: "expense", parentCode: "4" },

  { code: "4.2.01", name: "Costo de Ventas", type: "expense", parentCode: "4.2" },
  { code: "4.2.01.001", name: "Costo de Mercaderias Vendidas", type: "expense", parentCode: "4.2.01" },

  { code: "4.2.02", name: "Costo de Servicios", type: "expense", parentCode: "4.2" },

  // 4.3 — Gastos de Administracion y Ventas
  { code: "4.3", name: "Gastos de Administracion y Ventas", type: "expense", parentCode: "4" },

  { code: "4.3.01", name: "Remuneraciones", type: "expense", parentCode: "4.3" },
  { code: "4.3.01.001", name: "Sueldos y Salarios", type: "expense", parentCode: "4.3.01" },
  { code: "4.3.01.002", name: "Gratificaciones", type: "expense", parentCode: "4.3.01" },
  { code: "4.3.01.003", name: "Leyes Sociales (Empleador)", type: "expense", parentCode: "4.3.01" },

  { code: "4.3.02", name: "Gastos Generales", type: "expense", parentCode: "4.3" },
  { code: "4.3.02.001", name: "Arriendo", type: "expense", parentCode: "4.3.02" },
  { code: "4.3.02.002", name: "Servicios Basicos", type: "expense", parentCode: "4.3.02" },
  { code: "4.3.02.003", name: "Seguros", type: "expense", parentCode: "4.3.02" },
  { code: "4.3.02.004", name: "Depreciacion", type: "expense", parentCode: "4.3.02" },
  { code: "4.3.02.005", name: "Gastos de Oficina", type: "expense", parentCode: "4.3.02" },
  { code: "4.3.02.006", name: "Gastos de Representacion", type: "expense", parentCode: "4.3.02" },

  { code: "4.3.03", name: "Gastos de Ventas", type: "expense", parentCode: "4.3" },
  { code: "4.3.03.001", name: "Comisiones de Venta", type: "expense", parentCode: "4.3.03" },
  { code: "4.3.03.002", name: "Publicidad y Marketing", type: "expense", parentCode: "4.3.03" },
  { code: "4.3.03.003", name: "Fletes y Distribuciones", type: "expense", parentCode: "4.3.03" },

  // 4.4 — Ingresos Fuera de Explotacion
  { code: "4.4", name: "Ingresos Fuera de Explotacion", type: "revenue", parentCode: "4" },

  { code: "4.4.01", name: "Ingresos Financieros", type: "revenue", parentCode: "4.4" },
  { code: "4.4.01.001", name: "Intereses Ganados", type: "revenue", parentCode: "4.4.01" },

  { code: "4.4.02", name: "Otros Ingresos", type: "revenue", parentCode: "4.4" },
  { code: "4.4.02.001", name: "Utilidad en Venta de Activo Fijo", type: "revenue", parentCode: "4.4.02" },
  { code: "4.4.02.002", name: "Correccion Monetaria (Ganancia)", type: "revenue", parentCode: "4.4.02" },

  // 4.5 — Egresos Fuera de Explotacion
  { code: "4.5", name: "Egresos Fuera de Explotacion", type: "expense", parentCode: "4" },

  { code: "4.5.01", name: "Gastos Financieros", type: "expense", parentCode: "4.5" },
  { code: "4.5.01.001", name: "Intereses Bancarios", type: "expense", parentCode: "4.5.01" },
  { code: "4.5.01.002", name: "Comisiones Bancarias", type: "expense", parentCode: "4.5.01" },

  { code: "4.5.02", name: "Otros Egresos", type: "expense", parentCode: "4.5" },
  { code: "4.5.02.001", name: "Perdida en Venta de Activo Fijo", type: "expense", parentCode: "4.5.02" },
  { code: "4.5.02.002", name: "Correccion Monetaria (Perdida)", type: "expense", parentCode: "4.5.02" },

  // 4.6 — Impuesto a la Renta
  { code: "4.6", name: "Impuesto a la Renta", type: "expense", parentCode: "4" },

  { code: "4.6.01", name: "Impuesto Renta", type: "expense", parentCode: "4.6" },
  { code: "4.6.01.001", name: "Impuesto Renta Primera Categoria", type: "expense", parentCode: "4.6.01" },
];

/**
 * Creates a Chart pre-loaded with the standard SII chart of accounts.
 */
export function createSiiChart(): Chart {
  return createChart(siiAccounts);
}
