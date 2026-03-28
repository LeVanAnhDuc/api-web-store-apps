import type { Express } from "express";
import {
  handleNotFound,
  handleError
} from "@/middlewares/filters/error.filter";
import { handleMongooseError } from "@/middlewares/filters/mongoose-error.filter";

export const loadErrorHandlers = (app: Express): void => {
  app.use(handleNotFound);
  app.use(handleMongooseError);
  app.use(handleError);
};
