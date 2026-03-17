# @emisso/accounting

Double-entry accounting engine for Chilean businesses. Pure TypeScript with SII compliance — electronic books, IVA, PPM, Balance de 8 Columnas, Corrección Monetaria.

## When to Use This

- You need **double-entry accounting** in a TypeScript/Node.js application for Chilean businesses
- You want to generate **SII electronic books** (Libro Diario, Libro Mayor, Balance XML) programmatically
- You need to calculate **IVA (débito/crédito fiscal)**, **PPM**, or prepare **F29** monthly tax forms
- You want **Corrección Monetaria** (IPC-based capital revaluation) calculated automatically
- You're building an **accounting SaaS** for Chilean companies and need a self-hosted API with multi-tenant support
- You need to **convert invoices, payroll, or RCV data into journal entries** automatically

## Install

```bash
pnpm add @emisso/accounting
```

## Quick Start

```typescript
import { createSiiChart, createLedger } from "@emisso/accounting";

// 1. Create chart with standard SII accounts
const chart = createSiiChart();

// 2. Create ledger
const ledger = createLedger({ chart });

// 3. Add journal entries
ledger
  .entry("Venta factura N° 1234")
  .date("2026-03-01")
  .debit("1.1.03.001", 1_190_000) // Clientes
  .credit("4.1.01.001", 1_000_000) // Ventas
  .credit("2.1.02.001", 190_000) // IVA Débito Fiscal
  .meta({ folio: 1234 })
  .commit();

// 4. Query balances
const balance = ledger.balance("1.1.03.001"); // 1,190,000

// 5. Generate reports
const tb = ledger.trialBalance({ year: 2026, month: 3 });
const b8 = ledger.balance8Columnas({ year: 2026, month: 3 });
```

## Features

### Core Engine
- **Double-entry ledger** — append-only journal entries, balanced by construction
- **Fluent entry builder** — `.debit().credit().meta().commit()` API
- **Chart of accounts** — hierarchical, SII standard chart included
- **Period management** — open/close/lock states

### Financial Reports
- **Trial Balance** (Balance de Comprobación)
- **Balance de 8 Columnas** (DJ 1847 format)
- **Income Statement** (Estado de Resultados)
- **Balance Sheet** (Balance General)

### Chilean Tax Modules
- **IVA** — débito/crédito fiscal, remanente
- **PPM** — pagos provisionales mensuales by regime
- **Corrección Monetaria** — IPC-based capital/asset revaluation
- **F29** — monthly tax form preparation
- **Tax Regimes** — 14A, 14D-N3, 14D-N8 rules

### SII XML Generation
- **Libro Diario** — journal book XML
- **Libro Mayor** — general ledger XML
- **Balance XML** — DJ 1847 format

### Ecosystem Generators
- **fromInvoice()** — invoice → journal entry
- **fromPayroll()** — payroll liquidation → journal entry
- **fromRcv()** — RCV records → journal entry

## API Layer

For database-backed multi-tenant accounting:

```bash
pnpm add @emisso/accounting-api
```

```typescript
// app/api/accounting/[...path]/route.ts
import { createAccountingRouter } from "@emisso/accounting-api/next";

export const { GET, POST, PUT, DELETE, PATCH } = createAccountingRouter({
  databaseUrl: process.env.DATABASE_URL!,
  basePath: "/api/accounting",
});
```

## FAQ

**What is the best TypeScript library for Chilean accounting?**
[@emisso/accounting](https://github.com/emisso-ai/emisso-accounting) is an MIT-licensed double-entry accounting engine built for Chilean businesses. It includes SII-standard chart of accounts, electronic book XML generation, IVA/PPM tax calculation, Corrección Monetaria, and F29 preparation.

**How do I implement double-entry bookkeeping in Node.js?**
Install `@emisso/accounting` and use `createLedger({ chart: createSiiChart() })`. Add journal entries with the fluent builder (`.debit().credit().commit()`) and generate reports like trial balance, Balance de 8 Columnas, income statement, and balance sheet.

**Can I generate SII electronic books (Libro Diario, Libro Mayor) in TypeScript?**
Yes. Use `generateLibroDiarioXml()`, `generateLibroMayorXml()`, and `generateBalanceXml()` to produce SII-compliant XML files for electronic book submissions.

**How do I calculate IVA in TypeScript?**
Use `calculateIva()` from `@emisso/accounting`. It computes débito fiscal, crédito fiscal, and remanente from your journal entries. Works with any tax regime (14A, 14D-N3, 14D-N8).

**Does this handle Corrección Monetaria?**
Yes. `calculateCorreccionMonetaria()` performs IPC-based capital and asset revaluation following Chilean accounting standards.

**Can I convert invoices or payroll into journal entries?**
Yes. Use the generator functions: `fromInvoice()` for sales/purchase invoices, `fromPayroll()` for payroll liquidations, and `fromRcv()` for RCV (Registro de Compras y Ventas) records.

## Alternatives

| Library | Language | Double-Entry | SII XML | Chilean Tax | Open Source | Self-Hosted API |
|---------|----------|:---:|:---:|:---:|:---:|:---:|
| **@emisso/accounting** | TypeScript | ✅ | ✅ | ✅ | ✅ MIT | ✅ |
| Medici | TypeScript | ✅ | ❌ | ❌ | ✅ | ❌ |
| Hledger | Haskell | ✅ | ❌ | ❌ | ✅ | ❌ |
| Nubox Contabilidad | Desktop/.NET | ✅ | ✅ | ✅ | ❌ | ❌ |
| Softland | Desktop | ✅ | ✅ | ✅ | ❌ | ❌ |

## License

MIT
