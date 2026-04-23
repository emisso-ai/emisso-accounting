# @emisso/accounting-api

## 0.2.1

### Patch Changes

- 3e49479: Fix package `exports` and resolve circular dependency in Drizzle schema.

  - `@emisso/accounting-api`: `exports` field referenced `./dist/index.mjs` and `./dist/adapters/next.mjs` which tsup never emits (it produces `.js` for ESM and `.cjs` for CJS). Fixed to point to the actual emitted files. Also swapped `main` to `./dist/index.cjs` for CommonJS consumers.
  - `@emisso/accounting-api`: moved `accountingSchema` (the `pgSchema("accounting")` instance) to a dedicated `_schema.ts` file. Previously it was defined in `index.ts`, which re-exported all tables; the tables in turn imported `accountingSchema` from `./index.js`, creating a circular ESM dependency that left `accountingSchema` undefined at table-evaluation time.
  - `@emisso/accounting`: patch re-publish to ship the correct `exports` field that was already fixed in the working tree but never published.

- Updated dependencies [3e49479]
  - @emisso/accounting@0.2.1

## 0.2.0

### Minor Changes

- e1d5365: Release of `@emisso/accounting` (double-entry engine) and `@emisso/accounting-api` (Effect TS API layer with Drizzle + Supabase adapters).

### Patch Changes

- Updated dependencies [e1d5365]
  - @emisso/accounting@0.2.0
