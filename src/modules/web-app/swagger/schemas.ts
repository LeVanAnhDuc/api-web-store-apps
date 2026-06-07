// types
import type { OpenAPIV3 } from "openapi-types";

export const webAppSwaggerSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  AdminAppResponse: {
    type: "object",
    required: [
      "_id",
      "name",
      "displayName",
      "description",
      "iconUrl",
      "homeUrl",
      "categoryId",
      "status",
      "requiredRoles",
      "redirectUris",
      "clientId",
      "createdAt",
      "updatedAt"
    ],
    properties: {
      _id: {
        type: "string",
        example: "507f1f77bcf86cd799439011",
        description: "MongoDB _id of the app"
      },
      name: {
        type: "string",
        example: "satellite-monitor",
        description: "Internal unique app name"
      },
      displayName: {
        type: "string",
        example: "Satellite Monitor"
      },
      description: {
        type: "string",
        nullable: true,
        example: "Real-time constellation monitoring dashboard"
      },
      iconUrl: {
        type: "string",
        nullable: true,
        example: "https://cdn.example.com/icons/satellite-monitor.png"
      },
      homeUrl: {
        type: "string",
        example: "https://monitor.example.com"
      },
      categoryId: {
        type: "string",
        example: "507f1f77bcf86cd799439012",
        description: "MongoDB _id of the owning category"
      },
      status: {
        type: "string",
        enum: ["active", "inactive"],
        example: "active"
      },
      requiredRoles: {
        type: "array",
        items: {
          type: "string",
          enum: ["user", "admin"]
        },
        example: ["user"]
      },
      redirectUris: {
        type: "array",
        items: { type: "string" },
        example: ["https://monitor.example.com/callback"]
      },
      clientId: {
        type: "string",
        example: "client_abc123",
        description: "OAuth client identifier"
      },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2025-01-15T10:30:00.000Z"
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        example: "2025-01-15T10:30:00.000Z"
      }
    }
  },
  AdminAppListResponse: {
    type: "object",
    required: ["items"],
    properties: {
      items: {
        type: "array",
        items: { $ref: "#/components/schemas/AdminAppResponse" }
      }
    }
  },
  AdminCategoryResponse: {
    type: "object",
    required: ["_id", "name", "slug"],
    properties: {
      _id: {
        type: "string",
        example: "507f1f77bcf86cd799439012",
        description: "MongoDB _id of the category"
      },
      name: {
        type: "string",
        example: "Monitoring",
        description: "Human-readable category display name"
      },
      slug: {
        type: "string",
        example: "monitoring",
        description: "Internal unique category name used as a slug"
      }
    }
  }
};
