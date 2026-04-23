# @emisso/accounting — Copilot Instructions

Double-entry accounting engine for Chilean businesses — SII electronic books, IVA, PPM, Balance de 8 Columnas, Corrección Monetaria.

## Monorepo Structure

- `packages/engine/` — `@emisso/accounting`: Pure calculation engine, zero I/O, zod only.
- `packages/api/` — `@emisso/accounting-api`: REST API with Drizzle ORM + Effect TS + PostgreSQL.

## Code Style

- TypeScript strict mode, ESM-first (CJS compat via tsup)
- Zod for all data validation
- Engine is pure — zero I/O, append-only ledger
- All money is integer CLP — arithmetic via money.ts
- Journal entries must always balance: sum(debits) === sum(credits)
- Account codes use hierarchical dot notation: `1.1.01.001`
- API uses Effect TS layers: Repo → Service → Handler
- Tests: vitest with hand-verified values (178 tests); API tests use PGLite
- Conventional Commits: `feat(engine): add F29 preparation`

## Testing

```bash
pnpm test:run     # CI mode
pnpm test         # Watch mode
```

## Key Patterns

- Ledger is append-only — entries are never mutated, voided by reverse entry
- Normal balance: assets/expenses = debit, liabilities/equity/revenue = credit
- SII chart follows hierarchical structure: class.group.subgroup.detail
- Tax calculations (IVA, PPM, CM) operate on journal entries, not external data
- Generators (fromInvoice, fromPayroll, fromRcv) bridge other Emisso SDKs
