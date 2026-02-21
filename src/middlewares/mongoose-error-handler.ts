import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { BadRequestError } from "../configurations/responses/error";

// Mapping of Mongoose validation paths to i18next translation keys
const VALIDATION_KEY_MAP: Record<string, I18n.Key> = {
  email: "validation:email.required",
  password: "validation:password.required",
  authId: "validation:authId.required",
  fullName: "validation:fullName.required",
  phone: "validation:phone.required"
};

const EMAIL_INVALID_KEY: I18n.Key = "validation:email.invalid";
const PASSWORD_MIN_LENGTH_KEY: I18n.Key = "validation:password.minLength";
const FULL_NAME_MIN_LENGTH_KEY: I18n.Key = "validation:fullName.minLength";
const FULL_NAME_MAX_LENGTH_KEY: I18n.Key = "validation:fullName.maxLength";
const PHONE_INVALID_KEY: I18n.Key = "validation:phone.invalid";
const ADDRESS_MAX_LENGTH_KEY: I18n.Key = "validation:address.maxLength";

export const handleMongooseError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof mongoose.Error.ValidationError) {
    const firstError = Object.values(err.errors)[0];
    const translationKey = getTranslationKey(firstError);
    const message = req.t(translationKey);

    return next(new BadRequestError(message));
  }

  next(err);
};

const getTranslationKey = (
  error: mongoose.Error.ValidatorError | mongoose.Error.CastError
): I18n.Key => {
  if (error instanceof mongoose.Error.ValidatorError) {
    const { path, kind } = error;

    if (kind === "required") {
      return VALIDATION_KEY_MAP[path] || "validation:required";
    }

    if (kind === "minlength") {
      if (path === "password") return PASSWORD_MIN_LENGTH_KEY;
      if (path === "fullName") return FULL_NAME_MIN_LENGTH_KEY;
    }

    if (kind === "maxlength") {
      if (path === "fullName") return FULL_NAME_MAX_LENGTH_KEY;
      if (path === "address") return ADDRESS_MAX_LENGTH_KEY;
    }

    if (kind === "regexp") {
      if (path === "email") return EMAIL_INVALID_KEY;
      if (path === "phone") return PHONE_INVALID_KEY;
    }
  }

  return "common:errors.internalServer";
};
