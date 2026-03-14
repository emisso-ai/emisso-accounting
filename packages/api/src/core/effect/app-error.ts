/**
 * Application errors for Effect-based accounting API logic.
 * Uses Data.TaggedError which automatically sets `_tag` as the discriminator.
 */

import { Data } from "effect";

// ============================================================================
// ERROR TYPES
// ============================================================================

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly message: string;
  readonly entity?: string;
  readonly entityId?: string;
}> {
  static make(entity: string, entityId?: string): NotFoundError {
    return new NotFoundError({
      message: `${entity} not found${entityId ? `: ${entityId}` : ""}`,
      entity,
      entityId,
    });
  }
}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
  readonly field?: string;
  readonly details?: Record<string, unknown>;
  readonly fieldErrors?: Array<{ path: string; message: string }>;
}> {
  static make(
    message: string,
    field?: string,
    details?: Record<string, unknown>,
  ): ValidationError {
    return new ValidationError({
      message,
      field,
      details,
    });
  }

  static fromZodErrors(
    message: string,
    issues: Array<{ path: (string | number)[]; message: string }>,
  ): ValidationError {
    return new ValidationError({
      message,
      fieldErrors: issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }
}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  readonly message: string;
  readonly requiredPermission?: string;
}> {
  static make(
    message: string = "Forbidden",
    requiredPermission?: string,
  ): ForbiddenError {
    return new ForbiddenError({
      message,
      requiredPermission,
    });
  }
}

export class DbError extends Data.TaggedError("DbError")<{
  readonly message: string;
  readonly operation?: string;
  readonly cause?: unknown;
}> {
  static make(operation: string, cause?: unknown): DbError {
    const message =
      cause instanceof Error ? cause.message : "Database operation failed";
    return new DbError({
      message,
      operation,
      cause,
    });
  }
}

export class ConflictError extends Data.TaggedError("ConflictError")<{
  readonly message: string;
  readonly resource?: string;
  readonly conflictingValue?: string;
}> {
  static make(
    message: string,
    resource?: string,
    conflictingValue?: string,
  ): ConflictError {
    return new ConflictError({
      message,
      resource,
      conflictingValue,
    });
  }
}

export class UnbalancedEntryError extends Data.TaggedError("UnbalancedEntryError")<{
  readonly message: string;
  readonly debits: number;
  readonly credits: number;
}> {
  static make(debits: number, credits: number): UnbalancedEntryError {
    return new UnbalancedEntryError({
      message: `Entry is unbalanced: debits=${debits}, credits=${credits}`,
      debits,
      credits,
    });
  }
}

export class PeriodClosedError extends Data.TaggedError("PeriodClosedError")<{
  readonly message: string;
  readonly period: string;
  readonly closedAt?: string;
}> {
  static make(period: string, closedAt?: string): PeriodClosedError {
    return new PeriodClosedError({
      message: `Period is closed: ${period}`,
      period,
      closedAt,
    });
  }
}

export class AccountNotFoundError extends Data.TaggedError("AccountNotFoundError")<{
  readonly message: string;
  readonly accountCode: string;
}> {
  static make(accountCode: string): AccountNotFoundError {
    return new AccountNotFoundError({
      message: `Account not found: ${accountCode}`,
      accountCode,
    });
  }
}

// ============================================================================
// UNION TYPE
// ============================================================================

export type AppError =
  | NotFoundError
  | ValidationError
  | ForbiddenError
  | DbError
  | ConflictError
  | UnbalancedEntryError
  | PeriodClosedError
  | AccountNotFoundError;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof NotFoundError ||
    error instanceof ValidationError ||
    error instanceof ForbiddenError ||
    error instanceof DbError ||
    error instanceof ConflictError ||
    error instanceof UnbalancedEntryError ||
    error instanceof PeriodClosedError ||
    error instanceof AccountNotFoundError
  );
}

// ============================================================================
// SERIALIZATION
// ============================================================================

export function serializeAppError(error: AppError): {
  _type: string;
  message: string;
  [key: string]: unknown;
} {
  const result: Record<string, unknown> = {
    _type: error._tag,
    message: error.message,
  };

  switch (error._tag) {
    case "NotFoundError":
      if (error.entity) result.entity = error.entity;
      if (error.entityId) result.entityId = error.entityId;
      break;
    case "ValidationError":
      if (error.field) result.field = error.field;
      if (error.details) result.details = error.details;
      if (error.fieldErrors) result.fieldErrors = error.fieldErrors;
      break;
    case "ForbiddenError":
      if (error.requiredPermission)
        result.requiredPermission = error.requiredPermission;
      break;
    case "DbError":
      if (error.operation) result.operation = error.operation;
      break;
    case "ConflictError":
      if (error.resource) result.resource = error.resource;
      if (error.conflictingValue)
        result.conflictingValue = error.conflictingValue;
      break;
    case "UnbalancedEntryError":
      result.debits = error.debits;
      result.credits = error.credits;
      break;
    case "PeriodClosedError":
      result.period = error.period;
      if (error.closedAt) result.closedAt = error.closedAt;
      break;
    case "AccountNotFoundError":
      result.accountCode = error.accountCode;
      break;
    default: {
      const _exhaustive: never = error;
      throw new Error(`Unhandled error type: ${(error as any)._tag}`);
    }
  }

  return result as { _type: string; message: string; [key: string]: unknown };
}
