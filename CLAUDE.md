# @emisso/accounting

Double-entry accounting engine for Chilean businesses.

## Structure

```
emisso-accounting/
├── packages/
│   ├── engine/              @emisso/accounting — pure TS, zod only
│   │   ├── src/
│   │   │   ├── types.ts         Zod schemas + interfaces
│   │   │   ├── money.ts         CLP integer arithmetic
│   │   │   ├── accounts/        Chart of accounts + SII standard
│   │   │   ├── ledger/          Core ledger, entry builder, period mgmt
│   │   │   ├── reports/         Trial balance, 8 columnas, income stmt, balance sheet
│   │   │   ├── tax/             IVA, PPM, CM, F29, regimes
│   │   │   ├── xml/             SII XML generation (libro diario/mayor, balance)
│   │   │   └── generators/      Invoice/payroll/RCV → journal entries
│   │   └── tests/               178 tests, hand-verified values
│   └── api/                 @emisso/accounting-api — Effect TS, Drizzle, PostgreSQL
│       ├── src/
│       │   ├── core/effect/     AppError, http-response, repo-helpers
│       │   ├── db/schema/       Drizzle tables (accounting schema)
│       │   ├── repos/           Data access (account, entry, period)
│       │   ├── services/        Business logic (ledger, account, period, tax)
│       │   ├── handlers/        HTTP handlers + router
│       │   ├── adapters/        Next.js adapter
│       │   └── validation/      Zod request schemas
│       └── tests/helpers/       PGLite test setup
```

## Commands

```bash
pnpm build        # Build all packages
pnpm test:run     # Run all tests (CI mode)
pnpm lint         # Typecheck all packages
```

## Code Patterns

- **Engine:** Pure TypeScript, zero I/O, zod only dependency
- **API:** Effect TS layers (Repo → Service → Handler), Data.TaggedError
- **Money:** Integer CLP only, all arithmetic via money.ts
- **Tests:** Hand-verified values, no mocks, PGLite for DB tests
- **Build:** tsup dual CJS+ESM with .d.ts

## Key Invariants

- Journal entries are **append-only** — never mutated, voided by reverse entry
- All entries must balance: sum(debits) === sum(credits)
- CLP has **no decimals** — all amounts are integers
- Account codes follow hierarchical dot notation: `1.1.01.001`
- Normal balance: assets/expenses = debit, liabilities/equity/revenue = credit
