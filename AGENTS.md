# @emisso/accounting

> Double-entry accounting engine for Chilean businesses — SII electronic books, IVA, PPM, Balance de 8 Columnas, Corrección Monetaria.

## Overview

@emisso/accounting is a pure TypeScript double-entry accounting engine designed for Chilean businesses. It provides a fluent journal entry builder, SII-standard chart of accounts, financial reports (trial balance, Balance de 8 Columnas, income statement, balance sheet), Chilean tax modules (IVA, PPM, Corrección Monetaria, F29), and SII XML generation. An optional API package adds a self-hosted REST layer with PostgreSQL persistence and multi-tenant support.

## Architecture

Monorepo with three packages:

- **`packages/engine`** (`@emisso/accounting`) — Pure calculation engine. Zero I/O, zod only. Append-only ledger, fluent entry builder.
- **`packages/api`** (`@emisso/accounting-api`) — REST API layer. Drizzle ORM + Effect TS + PostgreSQL. Next.js adapter included.
- **`packages/cli`** (`@emisso/accounting-cli`) — Command-line interface for chart seeding, entry management, period operations, imports (invoice/payroll/RCV), and reports.

## Key Invariants

- Journal entries are **append-only** — never mutated, voided by reverse entry
- All entries must balance: `sum(debits) === sum(credits)`
- CLP has **no decimals** — all amounts are integers
- Account codes follow hierarchical dot notation: `1.1.01.001`
- Normal balance: assets/expenses = debit, liabilities/equity/revenue = credit

## Getting Started

```bash
npm install @emisso/accounting
```

```typescript
import { createSiiChart, createLedger } from "@emisso/accounting";

const chart = createSiiChart();
const ledger = createLedger({ chart });

ledger
  .entry("Venta factura N° 1234")
  .date("2026-03-01")
  .debit("1.1.03.001", 1_190_000)
  .credit("4.1.01.001", 1_000_000)
  .credit("2.1.02.001", 190_000)
  .meta({ folio: 1234 })
  .commit();

const balance = ledger.balance("1.1.03.001"); // 1,190,000
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/engine/src/index.ts` | Public API — all engine exports |
| `packages/engine/src/types.ts` | Zod schemas + TypeScript types |
| `packages/engine/src/money.ts` | CLP integer arithmetic |
| `packages/engine/src/accounts/chart.ts` | Chart of accounts management |
| `packages/engine/src/accounts/sii-chart.ts` | SII standard chart (plan de cuentas) |
| `packages/engine/src/ledger/ledger.ts` | Core ledger + balance queries |
| `packages/engine/src/ledger/entry.ts` | Fluent entry builder |
| `packages/engine/src/ledger/period.ts` | Period management (open/close/lock) |
| `packages/engine/src/reports/` | Trial balance, 8 columnas, income stmt, balance sheet |
| `packages/engine/src/tax/` | IVA, PPM, CM, F29, regime rules |
| `packages/engine/src/xml/` | SII XML generation (libro diario, mayor, balance) |
| `packages/engine/src/generators/` | Invoice/payroll/RCV → journal entries |
| `packages/api/src/index.ts` | API package exports |
| `packages/api/src/handlers/` | HTTP handlers + router |
| `packages/api/src/adapters/next.ts` | Next.js App Router adapter |
| `packages/api/src/db/schema/` | Drizzle database schema |
| `packages/cli/bin/accounting.ts` | CLI entry point |
| `packages/cli/src/commands/` | CLI command implementations |

## Development

```bash
pnpm install              # Install dependencies
pnpm build                # Build all packages (tsup)
pnpm test                 # Run tests (vitest, watch mode)
pnpm test:run             # Run tests (CI mode)
pnpm lint                 # Typecheck (tsc --noEmit)
```

## Code Style

- TypeScript strict mode, ESM-first (CJS compat via tsup)
- Zod for all data validation
- Engine is pure — zero I/O, append-only ledger
- All money is integer CLP — arithmetic via money.ts
- API uses Effect TS layers: Repo → Service → Handler
- Tests use vitest with hand-verified values (178 tests); API tests use PGLite
- Conventional Commits for git messages
