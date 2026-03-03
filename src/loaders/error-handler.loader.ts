import type { Express } from "express";
import { handleNotFound, handleError } from "@/middlewares/error-handler";
import { handleMongooseError } from "@/middlewares/mongoose-error-handler";

export const loadErrorHandlers = (app: Express): void => {
  app.use(handleNotFound);
  app.use(handleMongooseError);
  app.use(handleError);
};
