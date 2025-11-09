// libs
import type { Request } from "express";
import type { Schema } from "joi";
// utils
import { getMessage } from "@/core/helpers/i18n";
import { asyncMiddlewareHandler } from "@/core/utils/async-handler";
// responses
import { BadRequestError } from "@/core/responses/error";

export const validate = (
  schema: Schema,
  messagePrefix: string,
  source: "body" | "params" | "query" = "body"
) =>
  asyncMiddlewareHandler(async (req: Request): Promise<void> => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorCode = error.details[0].message;
      const message = getMessage(`${messagePrefix}.${errorCode}`, req.locale);
      throw new BadRequestError(message);
    }

    req[source] = value;
  });
