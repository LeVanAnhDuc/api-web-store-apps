import type { Request } from "express";
import type { Schema } from "joi";

import { asyncMiddlewareHandler } from "@/core/utils/async-handler";
import { BadRequestError } from "@/core/responses/error";

export const validate = (
  schema: Schema,
  source: "body" | "params" | "query" = "body"
) =>
  asyncMiddlewareHandler(async (req: Request): Promise<void> => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const translationKey = error.details[0].message;
      // Translation key is configured directly in Joi schema messages
      const message = req.t(translationKey as I18n.Key);
      throw new BadRequestError(message);
    }

    req[source] = value;
  });
