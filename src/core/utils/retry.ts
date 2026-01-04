/**
 * Retry utility with exponential backoff
 * Use for fire-and-forget operations that need resilience
 */

import { Logger } from "./logger";

interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Operation name for logging */
  operationName?: string;
  /** Context data for logging */
  context?: Record<string, unknown>;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "context">> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  operationName: "operation"
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute async function with retry and exponential backoff
 * Fire-and-forget: errors are logged, not thrown
 */
export const withRetry = (
  fn: () => Promise<unknown>,
  options: RetryOptions = {}
): void => {
  const { maxAttempts, initialDelayMs, operationName } = {
    ...DEFAULT_OPTIONS,
    ...options
  };
  const context = options.context ?? {};

  const execute = async (attempt: number): Promise<void> => {
    try {
      await fn();
    } catch (error) {
      if (attempt >= maxAttempts) {
        Logger.error(`${operationName} failed after ${maxAttempts} attempts`, {
          ...context,
          error
        });
        return;
      }

      const delayMs = initialDelayMs * Math.pow(2, attempt - 1);

      Logger.warn(`${operationName} failed, retrying...`, {
        ...context,
        attempt,
        maxAttempts,
        nextRetryMs: delayMs
      });

      await delay(delayMs);
      await execute(attempt + 1);
    }
  };

  execute(1).catch((error) => {
    Logger.error(`${operationName} unexpected error`, { ...context, error });
  });
};
