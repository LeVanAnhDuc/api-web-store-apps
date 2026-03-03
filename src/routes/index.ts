import type { Express, Router } from "express";

export const mountRoutes = (app: Express, v1Router: Router): void => {
  app.use("/api/v1", v1Router);
};
