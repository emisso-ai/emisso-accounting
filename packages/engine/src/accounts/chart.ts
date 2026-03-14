import type { Account, AccountType, NormalBalance } from "../types.js";

export interface Chart {
  addAccount(account: Account): void;
  getAccount(code: string): Account | undefined;
  getChildren(code: string): Account[];
  validateCode(code: string): boolean;
  normalBalance(code: string): NormalBalance;
  toArray(): Account[];
  getAccountsByType(type: AccountType): Account[];
}

export function createChart(accounts?: Account[]): Chart {
  const accountMap = new Map<string, Account>();

  // Populate with initial accounts if provided
  if (accounts) {
    for (const account of accounts) {
      accountMap.set(account.code, account);
    }
  }

  return {
    addAccount(account: Account): void {
      // Validate parent exists if parentCode is provided
      if (account.parentCode && !accountMap.has(account.parentCode)) {
        throw new Error(`Parent account not found: ${account.parentCode}`);
      }
      accountMap.set(account.code, account);
    },

    getAccount(code: string): Account | undefined {
      return accountMap.get(code);
    },

    getChildren(code: string): Account[] {
      return Array.from(accountMap.values()).filter(
        (a) => a.parentCode === code,
      );
    },

    validateCode(code: string): boolean {
      return accountMap.has(code);
    },

    normalBalance(code: string): NormalBalance {
      const account = accountMap.get(code);
      if (!account) throw new Error(`Account not found: ${code}`);
      return getNormalBalance(account.type);
    },

    toArray(): Account[] {
      return Array.from(accountMap.values()).sort((a, b) =>
        a.code.localeCompare(b.code),
      );
    },

    getAccountsByType(type: AccountType): Account[] {
      return Array.from(accountMap.values())
        .filter((a) => a.type === type)
        .sort((a, b) => a.code.localeCompare(b.code));
    },
  };
}

export function getNormalBalance(type: AccountType): NormalBalance {
  switch (type) {
    case "asset":
    case "expense":
      return "debit";
    case "liability":
    case "equity":
    case "revenue":
      return "credit";
  }
}
