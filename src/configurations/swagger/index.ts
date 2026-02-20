import type { OpenAPIV3 } from "openapi-types";
import ENV from "../env";
import { commonSchemas, commonResponses } from "./common.schemas";
import { loginSwaggerSchemas, loginPaths } from "@/modules/login/swagger";
import { signupSwaggerSchemas, signupPaths } from "@/modules/signup/swagger";
import { logoutSwaggerSchemas, logoutPaths } from "@/modules/logout/swagger";
import { tokenSwaggerSchemas, tokenPaths } from "@/modules/token/swagger";

const PORT = ENV.APP_PORT || 3000;

const allSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  ...commonSchemas,
  ...loginSwaggerSchemas,
  ...signupSwaggerSchemas,
  ...logoutSwaggerSchemas,
  ...tokenSwaggerSchemas
};

const allPaths: OpenAPIV3.PathsObject = {
  ...loginPaths,
  ...signupPaths,
  ...logoutPaths,
  ...tokenPaths
};

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "AppStore Web API",
    version: "1.0.0",
    description: `RESTful API for AppStore Web Application.`.trim()
  },
  servers: [
    {
      url: `http://localhost:${PORT}/api/v1`,
      description: "Development server"
    }
  ],
  tags: [
    {
      name: "Auth - Signup",
      description: "User registration endpoints"
    },
    {
      name: "Auth - Login",
      description: "User authentication endpoints"
    },
    {
      name: "Auth - Session",
      description: "Session management endpoints (logout, token refresh)"
    }
  ],
  paths: allPaths,
  components: {
    schemas: allSchemas,
    responses: commonResponses,
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT access token"
      }
    }
  }
};
