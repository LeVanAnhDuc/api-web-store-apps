import type { OpenAPIV3 } from "openapi-types";

// =============================================================================
// Response Schemas
// =============================================================================

const LogoutResponseSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: true,
      description: "Logout success status"
    }
  }
};

// =============================================================================
// Export all schemas
// =============================================================================

export const logoutSwaggerSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  LogoutResponse: LogoutResponseSchema
};
