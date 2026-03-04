import type { OpenAPIV3 } from "openapi-types";

export const contactAdminSwaggerSchemas: Record<
  string,
  OpenAPIV3.SchemaObject
> = {
  SubmitContactRequest: {
    type: "object",
    required: ["subject", "category", "message"],
    properties: {
      email: {
        type: "string",
        format: "email",
        example: "user@example.com",
        description: "Optional contact email (auto-filled if logged in)"
      },
      subject: {
        type: "string",
        minLength: 5,
        maxLength: 200,
        example: "Cannot access my account"
      },
      category: {
        type: "string",
        enum: [
          "account",
          "technical",
          "feature",
          "billing",
          "security",
          "other"
        ],
        example: "account"
      },
      priority: {
        type: "string",
        enum: ["low", "medium", "high"],
        default: "medium",
        example: "medium"
      },
      message: {
        type: "string",
        minLength: 20,
        maxLength: 5000,
        example:
          "I have been unable to log in to my account for the past 2 days."
      },
      attachments: {
        type: "array",
        items: { type: "string", format: "binary" },
        description:
          "Up to 5 files, max 5MB each. Allowed: jpg, jpeg, png, gif, pdf, doc, docx"
      }
    }
  },
  SubmitContactResponse: {
    type: "object",
    properties: {
      ticketNumber: {
        type: "string",
        example: "TK-20260304-A1B2",
        description: "Unique ticket number for tracking"
      }
    }
  }
};
