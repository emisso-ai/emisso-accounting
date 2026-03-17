# @emisso/accounting

Double-entry accounting engine for Chilean businesses. Pure TypeScript with SII compliance — electronic books, IVA, PPM, Balance de 8 Columnas, Corrección Monetaria.

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

## CLI

```bash
npm install -g @emisso/accounting-cli
```

### Commands

| Command | Description |
|---------|-------------|
| `accounting chart list` | List all accounts (filter with `--type asset\|liability\|equity\|revenue\|expense`) |
| `accounting chart show <code>` | Show account details |
| `accounting chart seed` | Initialize chart of accounts (creates ledger file) |
| `accounting entry add -i entry.json` | Create journal entry from JSON |
| `accounting entry list` | List all journal entries |
| `accounting entry show <id>` | Display entry details |
| `accounting entry void <id>` | Void an entry (creates reversing entry) |
| `accounting import invoice -i invoice.json` | Convert invoice → journal entry |
| `accounting import payroll -i payroll.json` | Convert payroll liquidation → journal entry |
| `accounting import rcv -i rcv.json` | Convert RCV records → journal entry |
| `accounting report trial-balance --period 2026-03` | Trial Balance |
| `accounting report balance-8-columnas --period 2026-03` | Balance de 8 Columnas (DJ 1847) |
| `accounting report income-statement --period 2026-03` | Income Statement |
| `accounting report balance-sheet --period 2026-03` | Balance Sheet |
| `accounting tax iva --period 2026-03` | IVA calculation |
| `accounting tax ppm --period 2026-03` | PPM calculation |
| `accounting tax f29 --period 2026-03` | F29 monthly tax form |
| `accounting xml libro-diario --period 2026-03` | Generate Libro Diario XML |
| `accounting xml libro-mayor --period 2026-03` | Generate Libro Mayor XML |
| `accounting xml balance --period 2026-03` | Generate Balance XML |
| `accounting period list` | List all periods |
| `accounting period open --period 2026-03` | Open a period |
| `accounting period close --period 2026-03` | Close a period |
| `accounting period lock --period 2026-03` | Lock a period (immutable) |
| `accounting doctor` | Check system health and dependencies |

### Configuration

CLI flags take precedence over environment variables:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--ledger` | `ACCOUNTING_LEDGER` | Path to ledger JSON file |
| `--regime` | `ACCOUNTING_REGIME` | Tax regime (`14A`, `14D-N3`, `14D-N8`) |
| `--rut` | `ACCOUNTING_RUT` | Company RUT (for XML generation) |

### Output Formats

All commands support `--format table|csv|json|html` and `--json` shorthand.

```bash
accounting report trial-balance --period 2026-03 --json
accounting chart list --format csv > accounts.csv
```

## License

MIT
