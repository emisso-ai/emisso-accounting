export type TaxRegime = "14A" | "14D-N3" | "14D-N8";

export interface RegimeRules {
  regime: TaxRegime;
  name: string;
  accountingMethod: "accrual" | "cash";
  firstCategoryRate: number; // As percentage (e.g. 27 for 27%)
  ppmRate: number;           // As percentage (e.g. 0.25 for 0.25%)
  correccionMonetaria: boolean;
  maxAnnualRevenue?: number; // In UF
  description: string;
}

export const REGIME_RULES: Record<TaxRegime, RegimeRules> = {
  "14A": {
    regime: "14A",
    name: "Regimen General Semi-Integrado",
    accountingMethod: "accrual",
    firstCategoryRate: 27,
    ppmRate: 0.25,
    correccionMonetaria: true,
    description: "Regimen general para grandes empresas. Contabilidad completa, base devengada.",
  },
  "14D-N3": {
    regime: "14D-N3",
    name: "Pro-PYME General",
    accountingMethod: "cash",
    firstCategoryRate: 25,
    ppmRate: 0.125,
    correccionMonetaria: false,
    maxAnnualRevenue: 75_000,
    description: "Regimen Pro-PYME con contabilidad simplificada. Base percibida.",
  },
  "14D-N8": {
    regime: "14D-N8",
    name: "Pro-PYME Transparencia",
    accountingMethod: "cash",
    firstCategoryRate: 0,
    ppmRate: 0.25,
    correccionMonetaria: false,
    maxAnnualRevenue: 75_000,
    description: "Regimen transparente — utilidades tributadas directamente por los socios.",
  },
};

export function getRegimeRules(regime: TaxRegime): RegimeRules {
  return REGIME_RULES[regime];
}
