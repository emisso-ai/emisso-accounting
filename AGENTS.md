# @emisso/accounting

> Double-entry accounting engine for Chilean businesses — chart of accounts, ledger, trial balance, 8 columnas, F29, IVA/PPM, SII XML generation.

## Overview

@emisso/accounting is a pure TypeScript double-entry accounting engine. It handles chart of accounts (SII standard), journal entries, period management, financial reports (trial balance, 8 columnas, income statement, balance sheet), Chilean tax calculations (IVA, PPM, CM, F29), and SII XML generation. An optional API package adds a self-hosted REST layer with PostgreSQL persistence and multi-tenant support.

## Architecture

Monorepo with two packages:

- **`packages/engine`** (`@emisso/accounting`) — Pure calculation engine. Zero I/O, zod only. All amounts are integer CLP.
- **`packages/api`** (`@emisso/accounting-api`) — REST API layer. Drizzle ORM + Effect TS + PostgreSQL. Next.js adapter included.

## Key Invariants

- Journal entries are **append-only** — never mutated, voided by reverse entry
- All entries must balance: `sum(debits) === sum(credits)`
- CLP has **no decimals** — all amounts are integers
- Account codes follow hierarchical dot notation: `1.1.01.001`
- Normal balance: assets/expenses = debit, liabilities/equity/revenue = credit

## Key Files

| File | Purpose |
|------|---------|
| `packages/engine/src/types.ts` | Zod schemas + TypeScript types |
| `packages/engine/src/money.ts` | CLP integer arithmetic utilities |
| `packages/engine/src/accounts/` | Chart of accounts + SII standard chart |
| `packages/engine/src/ledger/` | Core ledger, entry builder, period management |
| `packages/engine/src/reports/` | Trial balance, 8 columnas, income statement, balance sheet |
| `packages/engine/src/tax/` | IVA, PPM, CM, F29, tax regimes |
| `packages/engine/src/xml/` | SII XML generation (libro diario/mayor, balance) |
| `packages/engine/src/generators/` | Invoice/payroll/RCV to journal entry generators |
| `packages/api/src/handlers/` | HTTP handlers + router |
| `packages/api/src/adapters/` | Next.js App Router adapter |
| `packages/api/src/db/schema/` | Drizzle database schema |

## Development

```bash
pnpm install              # Install dependencies
pnpm build                # Build all packages (tsup)
pnpm test                 # Run tests (vitest, watch mode)
pnpm test:run             # Run tests (CI mode)
pnpm lint                 # Typecheck (tsc --noEmit)
```

## Code Conventions

- TypeScript strict mode, ESM-first (CJS compat via tsup)
- Zod for all data validation
- Engine is pure — zero I/O, all calculations are deterministic
- Money is integer CLP only — all arithmetic via money.ts
- API uses Effect TS layers: Repo, Service, Handler
- Tests use vitest with hand-verified values; API tests use PGLite
- Conventional Commits for git messages
