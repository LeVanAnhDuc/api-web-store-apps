import type { OpenAPIV3 } from "openapi-types";
import ENV from "../env";
import { commonSchemas, commonResponses } from "./common.schemas";
import { loginSwaggerSchemas, loginPaths } from "@/modules/login/swagger";
import { signupSwaggerSchemas, signupPaths } from "@/modules/signup/swagger";
import { logoutSwaggerSchemas, logoutPaths } from "@/modules/logout/swagger";
import { tokenSwaggerSchemas, tokenPaths } from "@/modules/token/swagger";
import {
  forgotPasswordSwaggerSchemas,
  forgotPasswordPaths
} from "@/modules/forgot-password/swagger";
import {
  contactAdminSwaggerSchemas,
  contactAdminPaths
} from "@/modules/contact-admin/swagger";
import { userSwaggerSchemas, userPaths } from "@/modules/user/swagger";

const PORT = ENV.APP_PORT || 3000;

const allSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  ...commonSchemas,
  ...loginSwaggerSchemas,
  ...signupSwaggerSchemas,
  ...logoutSwaggerSchemas,
  ...tokenSwaggerSchemas,
  ...forgotPasswordSwaggerSchemas,
  ...contactAdminSwaggerSchemas,
  ...userSwaggerSchemas
};

const allPaths: OpenAPIV3.PathsObject = {
  ...loginPaths,
  ...signupPaths,
  ...logoutPaths,
  ...tokenPaths,
  ...forgotPasswordPaths,
  ...contactAdminPaths,
  ...userPaths
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
    },
    {
      name: "Auth - Forgot Password",
      description: "Password recovery via OTP or magic link"
    },
    {
      name: "Contact Admin",
      description: "Submit contact requests to the admin"
    },
    {
      name: "User Profile",
      description: "View and update user profile, upload avatar"
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
