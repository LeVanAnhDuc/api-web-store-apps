import { Types } from "mongoose";
import { BadRequestError } from "@/config/responses/error";
import { EMAIL_FORMAT_PATTERN, EMAIL_VALIDATION } from "./constants";

export const validateEmail = (email: string): void => {
  if (!email || typeof email !== "string") {
    throw new BadRequestError("Email is required");
  }

  const trimmed = email.trim();

  if (
    trimmed.length < EMAIL_VALIDATION.MIN_LENGTH ||
    trimmed.length > EMAIL_VALIDATION.MAX_LENGTH
  ) {
    throw new BadRequestError("Invalid email format");
  }

  if (!EMAIL_FORMAT_PATTERN.test(trimmed)) {
    throw new BadRequestError("Invalid email format");
  }
};

export const validateObjectId = (id: string, fieldName: string): void => {
  if (!id || typeof id !== "string") {
    throw new BadRequestError(`${fieldName} is required`);
  }

  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Invalid ${fieldName} format`);
  }
};

export const validateRequiredString = (
  value: string,
  fieldName: string
): void => {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestError(`${fieldName} is required`);
  }
};
