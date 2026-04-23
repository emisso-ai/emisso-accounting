# Security Policy

## Reporting a Vulnerability

**Do not open a public issue.** Email **hello@emisso.ai** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact

We will acknowledge within 48 hours and aim to fix critical issues within 7 days.

## Sensitive Areas

This SDK handles financial accounting data. Accuracy and audit trail integrity are critical. Issues in these areas are treated with highest priority:

- Ledger entry creation and balancing (`packages/engine/src/ledger/`)
- Tax calculations — IVA, PPM, CM (`packages/engine/src/tax/`)
- SII XML generation (`packages/engine/src/xml/`)
- Financial reports — trial balance, 8 columnas (`packages/engine/src/reports/`)

## Key Invariant

Journal entries are **append-only** and must always balance: `sum(debits) === sum(credits)`. Any issue that could violate this invariant is treated as critical.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |

## Scope

- `@emisso/accounting`
- `@emisso/accounting-api`
