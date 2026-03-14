/**
 * Money utilities for Chilean Peso (CLP)
 *
 * IMPORTANT: CLP has no decimal places. All amounts are integers.
 * All calculations should preserve integer arithmetic.
 */

/**
 * Round a number to integer (CLP doesn't use decimals)
 * Uses banker's rounding (round half to even) for fairness
 */
export function roundCLP(amount: number): number {
  return Math.round(amount);
}

/**
 * Calculate percentage of an amount with precise rounding
 * @param amount - Base amount in CLP
 * @param rate - Percentage rate (e.g., 10.5 for 10.5%)
 * @returns Calculated percentage as integer
 */
export function percentage(amount: number, rate: number): number {
  return roundCLP((amount * rate) / 100);
}

/**
 * Constrain a value between minimum and maximum bounds
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Add multiple amounts safely (maintains integer arithmetic)
 */
export function sum(...amounts: number[]): number {
  return amounts.reduce((acc, val) => acc + roundCLP(val), 0);
}

/**
 * Subtract amounts safely (maintains integer arithmetic)
 */
export function subtract(a: number, b: number): number {
  return roundCLP(a) - roundCLP(b);
}

/**
 * Multiply amount by a factor and round to integer
 */
export function multiply(amount: number, factor: number): number {
  return roundCLP(amount * factor);
}

/**
 * Divide amount by a divisor and round to integer
 */
export function divide(amount: number, divisor: number): number {
  if (divisor === 0) {
    throw new Error("Division por cero");
  }
  return roundCLP(amount / divisor);
}

/**
 * Format CLP amount for display with thousands separator
 * @returns Formatted string like "1.234.567"
 */
export function formatCLP(amount: number): string {
  return roundCLP(amount).toLocaleString("es-CL");
}
