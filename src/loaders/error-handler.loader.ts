// types
import type { Express } from "express";
// middlewares
import {
  handleNotFound,
  handleError,
  handleMongooseError
} from "@/middlewares";

export const loadErrorHandlers = (app: Express): void => {
  app.use(handleNotFound);
  app.use(handleMongooseError);
  app.use(handleError);
};
