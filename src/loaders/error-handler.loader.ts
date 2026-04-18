// types
import type { Express } from "express";
// middlewares
import { handleNotFound, handleError } from "@/middlewares";

export const loadErrorHandlers = (app: Express): void => {
  app.use(handleNotFound);
  app.use(handleError);
};
