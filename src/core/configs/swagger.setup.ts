import type { Application } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { swaggerOptions } from "./swagger";

/**
 * Setup Swagger UI documentation
 * Handles the type compatibility issues with swagger-ui-express
 */
export const setupSwagger = (app: Application): void => {
  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  // Serve Swagger UI at /api-docs
  // Using type assertion to handle version conflicts between @types/express and @types/swagger-ui-express
  app.use(
    "/api-docs",
    swaggerUi.serve as unknown as Parameters<Application["use"]>[1],
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Apartment Web API Documentation",
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "list",
        filter: true,
        showRequestDuration: true
      }
    }) as unknown as Parameters<Application["use"]>[1]
  );

  // Swagger JSON endpoint (for external tools like Postman)
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};
