// libs
import type { Request, Response, NextFunction } from "express";
// helpers
import { getLocaleFromHeader } from "@/core/helpers/i18n";

export const setLocale = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.locale = getLocaleFromHeader(req.headers["accept-language"]);
  next();
};
