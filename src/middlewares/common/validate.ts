import type { Request } from "express";
import type { Schema } from "joi";
import { asyncMiddlewareHandler } from "@/utils/async-handler";
import { ValidationError, type FieldError } from "@/config/responses/error";

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
      const fields: FieldError[] = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: req.t(detail.message as I18n.Key)
      }));

      const mainMessage = req.t("common:errors.validationFailed");

      throw new ValidationError(mainMessage, fields);
    }

    req[source] = value;
  });
