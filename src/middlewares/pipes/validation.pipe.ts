// types
import type { Request, Response, NextFunction } from "express";
import type { Schema } from "joi";
// config
import { ValidationError, type FieldError } from "@/config/responses/error";

const validationPipe =
  (source: "body" | "params" | "query", schema: Schema) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
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
      next();
    } catch (error) {
      next(error);
    }
  };

export const bodyPipe = (schema: Schema) => validationPipe("body", schema);
export const paramsPipe = (schema: Schema) => validationPipe("params", schema);
export const queryPipe = (schema: Schema) => validationPipe("query", schema);
