# Contributing to @emisso/accounting

Thanks for your interest in contributing!

## Getting Started

```bash
git clone https://github.com/emisso-ai/emisso-accounting.git
cd emisso-accounting
pnpm install
pnpm build
pnpm test:run
pnpm lint
```

## Project Structure

```
packages/
  engine/   @emisso/accounting      — Pure calculation engine (zero I/O, zod only)
  api/      @emisso/accounting-api  — REST API: Effect TS + Drizzle + PostgreSQL
```

## Development Workflow

1. **Fork** and create a branch from `main`
2. **Make changes** following the conventions below
3. **Add a changeset**: `pnpm changeset`
4. **Verify**: `pnpm build && pnpm lint && pnpm test:run`
5. **Open a PR**

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat(ledger):`, `fix(tax):`, etc.
- **TypeScript strict**, Zod at boundaries
- **Engine is pure** — zero I/O, all calculations are deterministic
- **Money is integer CLP** — all arithmetic via `money.ts`, never use floating point
- **Entries are append-only** — never mutate, void by reverse entry
- **Entries must balance** — `sum(debits) === sum(credits)` is an inviolable invariant
- **Account codes** follow hierarchical dot notation: `1.1.01.001`
- **API uses Effect TS** — Repo, Service, Handler layers
- **Tests:** Vitest, hand-verified values, PGLite for API tests

## Ideas Welcome

- New report types
- Tax regime support
- SII XML format additions
- Invoice/payroll/RCV journal entry generators
- Documentation and examples

## Reporting Issues

- **Bugs:** Include expected vs actual amounts for calculation issues
- **Features:** Describe the use case
- **Security:** Email hello@emisso.ai (see [SECURITY.md](./SECURITY.md))

## License

By contributing, you agree your contributions are licensed under [MIT](./LICENSE).
