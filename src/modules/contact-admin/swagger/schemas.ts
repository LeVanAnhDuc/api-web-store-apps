import type { OpenAPIV3 } from "openapi-types";

export const contactAdminSwaggerSchemas: Record<
  string,
  OpenAPIV3.SchemaObject
> = {
  SubmitContactRequest: {
    type: "object",
    required: ["subject", "message"],
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
  UpdateContactCategoryRequest: {
    type: "object",
    required: ["category"],
    properties: {
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
        example: "technical"
      }
    }
  },
  SubmitContactResponse: {
    type: "object",
    properties: {
      id: {
        type: "string",
        example: "507f1f77bcf86cd799439011",
        description: "MongoDB _id of the created contact"
      }
    }
  }
};
