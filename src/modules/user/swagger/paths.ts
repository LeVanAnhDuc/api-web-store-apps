// types
import type { OpenAPIV3 } from "openapi-types";
// others
import { ERROR_CODES } from "@/constants/error-code";

export const userPaths: OpenAPIV3.PathsObject = {
  "/users/me": {
    get: {
      summary: "Get my profile",
      description: `
Get the full profile of the currently authenticated user.

**Authentication:**
- Requires valid Bearer token (idToken)

**Returns:**
- All profile fields including email (from token), phone, address, dateOfBirth, gender, avatar (full URL)
      `.trim(),
      tags: ["User Profile"],
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Profile retrieved successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/SuccessResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/UserProfileResponse" }
                    }
                  }
                ]
              }
            }
          }
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": {
          description: "Internal Server Error (e.g. database unreachable)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    },
    patch: {
      summary: "Update my profile",
      description: `
Partially update the profile of the authenticated user. All fields are optional.

**Authentication:**
- Requires valid Bearer token (idToken)

**Rate Limits:**
- 10 requests per IP per 15 minutes

**Behavior:**
- Only the fields provided in the request body are updated
- Unknown fields are silently ignored (e.g. sending \`email\` has no effect)
- Sending an empty body \`{}\` returns 200 with no changes
      `.trim(),
      tags: ["User Profile"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateProfileRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Profile updated successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/SuccessResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/UserProfileResponse" }
                    }
                  }
                ]
              }
            }
          }
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "422": { $ref: "#/components/responses/ValidationError" },
        "429": { $ref: "#/components/responses/TooManyRequests" },
        "500": {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    }
  },
  "/users/me/avatar": {
    post: {
      summary: "Upload avatar",
      description: `
Upload a new avatar image for the authenticated user.

**Authentication:**
- Requires valid Bearer token (idToken)

**Rate Limits:**
- 5 requests per IP per 15 minutes

**File Requirements:**
- Field name: \`avatar\`
- Max size: 10MB
- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif, image/avif
- MIME type is validated from file content (not just extension)

**Notes:**
- Uploading a new avatar does NOT delete the old avatar file from disk
      `.trim(),
      tags: ["User Profile"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: { $ref: "#/components/schemas/UploadAvatarRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Avatar uploaded successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/SuccessResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        $ref: "#/components/schemas/UploadAvatarResponse"
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        "400": {
          description:
            "Bad Request — no file uploaded, file too large, or unsupported file type",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              examples: {
                noFile: {
                  summary: "No file uploaded",
                  value: {
                    code: ERROR_CODES.BAD_REQUEST,
                    message: "No file uploaded",
                    timestamp: "2026-01-01T00:00:00.000Z",
                    path: "/api/v1/users/me/avatar"
                  }
                },
                tooLarge: {
                  summary: "File too large",
                  value: {
                    code: ERROR_CODES.BAD_REQUEST,
                    message: "File too large. Max size is 10MB",
                    timestamp: "2026-01-01T00:00:00.000Z",
                    path: "/api/v1/users/me/avatar"
                  }
                },
                unsupportedType: {
                  summary: "Unsupported file type",
                  value: {
                    code: ERROR_CODES.BAD_REQUEST,
                    message: "File type not supported",
                    timestamp: "2026-01-01T00:00:00.000Z",
                    path: "/api/v1/users/me/avatar"
                  }
                }
              }
            }
          }
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "429": { $ref: "#/components/responses/TooManyRequests" },
        "500": {
          description: "Internal Server Error (e.g. disk write failure)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    }
  },
  "/users/{id}": {
    get: {
      summary: "Get public profile",
      description: `
Get the public profile of any user by their ID. Does not require authentication.

**Public fields only:**
- \`_id\`, \`fullName\`, \`avatar\`, \`gender\`
- Sensitive fields (email, phone, address, dateOfBirth) are never returned

**Params:**
- \`id\` must be a valid MongoDB ObjectId (24 hex characters)
      `.trim(),
      tags: ["User Profile"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "MongoDB ObjectId of the target user",
          schema: {
            type: "string",
            pattern: "^[a-fA-F0-9]{24}$",
            example: "64f1b2c3d4e5f6a7b8c9d0e1"
          }
        }
      ],
      responses: {
        "200": {
          description: "Public profile retrieved successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/SuccessResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        $ref: "#/components/schemas/PublicUserProfileResponse"
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        "400": {
          description: "Bad Request — invalid ObjectId format",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                code: ERROR_CODES.BAD_REQUEST,
                message: "Invalid user ID format",
                timestamp: "2026-01-01T00:00:00.000Z",
                path: "/api/v1/users/abc123"
              }
            }
          }
        },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    }
  }
};
