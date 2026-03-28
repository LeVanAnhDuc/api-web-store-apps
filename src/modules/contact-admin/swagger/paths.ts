import type { OpenAPIV3 } from "openapi-types";

export const contactAdminPaths: OpenAPIV3.PathsObject = {
  "/contact/submit": {
    post: {
      summary: "Submit a contact request",
      description: `
Submit a contact request to the admin.

**Rate Limits:**
- 5 requests per IP per 15 minutes
      `.trim(),
      tags: ["Contact Admin"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SubmitContactRequest" }
          }
        }
      },
      responses: {
        "201": {
          description: "Contact request submitted successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/SuccessResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        $ref: "#/components/schemas/SubmitContactResponse"
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "429": { $ref: "#/components/responses/TooManyRequests" }
      }
    }
  }
};
