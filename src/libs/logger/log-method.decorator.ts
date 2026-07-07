// others
import { Logger } from "./index";
import { RequestContext } from "@/utils/request-context";

export interface LogMethodOptions {
  name?: string;
  fields?: string[];
  level?: "info" | "debug";
}

function resolvePath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      obj
    );
}

function pickFields(arg: unknown, fields: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!fields.length || typeof arg !== "object" || arg === null) return out;
  for (const path of fields) {
    const value = resolvePath(arg, path);
    // Only log leaf primitives — never copy an object/array/function into the
    // log, which could leak sibling secrets (password/otp/token) if a caller
    // ever points `fields` at a container instead of a leaf.
    if (
      value !== undefined &&
      value !== null &&
      typeof value !== "object" &&
      typeof value !== "function"
    ) {
      const key = path.split(".").pop() as string;
      out[key] = value;
    }
  }
  return out;
}

export function LogMethod(options: LogMethodOptions = {}): MethodDecorator {
  const { name, fields = [], level = "info" } = options;

  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    const original = descriptor.value as (...args: unknown[]) => unknown;
    const className = target.constructor?.name ?? "";
    const methodName = String(propertyKey);
    const label =
      name ?? (className ? `${className}.${methodName}` : methodName);

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      // The aspect must NEVER throw from its own logging and break the business
      // flow (design §7). Building meta and every Logger call is guarded.
      let baseMeta: Record<string, unknown> = {};
      try {
        const picked = pickFields(args[0], fields);
        const requestId = RequestContext.getRequestId();
        baseMeta = { ...picked, ...(requestId ? { requestId } : {}) };
      } catch {
        baseMeta = {};
      }

      const start = Date.now();

      const logLifecycle = (
        message: string,
        extra?: Record<string, unknown>
      ): void => {
        try {
          Logger[level](message, extra ? { ...baseMeta, ...extra } : baseMeta);
        } catch {
          /* logging must never break the business flow */
        }
      };
      const logCompleted = (): void =>
        logLifecycle(`${label} completed`, { durationMs: Date.now() - start });
      const logFailed = (error: unknown): void => {
        try {
          Logger.error(`${label} failed`, error, {
            ...baseMeta,
            durationMs: Date.now() - start
          });
        } catch {
          /* logging must never break the business flow */
        }
      };

      logLifecycle(`${label} initiated`);

      let result: unknown;
      try {
        result = original.apply(this, args);
      } catch (error) {
        logFailed(error);
        throw error;
      }

      if (result instanceof Promise) {
        return result.then(
          (value) => {
            logCompleted();
            return value;
          },
          (error) => {
            logFailed(error);
            throw error;
          }
        );
      }

      logCompleted();
      return result;
    };

    return descriptor;
  };
}
