import type { OpenAPIV3 } from "openapi-types";

export const contactAdminPaths: OpenAPIV3.PathsObject = {
  "/contact/submit": {
    post: {
      summary: "Submit a contact request",
      description: `
Submit a contact request to the admin. Can be sent by both guests and authenticated users.

**Rate Limits:**
- 5 requests per IP per 15 minutes

**File Attachments:**
- Max 5 files per request
- Max 5MB per file
- Allowed types: jpg, jpeg, png, gif, pdf, doc, docx

**Auth:**
- Optional — if a valid Bearer token is provided, the request is linked to the user's account
      `.trim(),
      tags: ["Contact Admin"],
      security: [{ bearerAuth: [] }, {}],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
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
