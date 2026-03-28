// types
import type { Request } from "express";
import type { Schema } from "joi";
// utils
import { asyncMiddlewareHandler } from "@/utils/async-handler";
// config
import { ValidationError, type FieldError } from "@/config/responses/error";

const validate = (source: "body" | "params" | "query", schema: Schema) =>
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

export const validateBody = (schema: Schema) => validate("body", schema);
export const validateParams = (schema: Schema) => validate("params", schema);
export const validateQuery = (schema: Schema) => validate("query", schema);
