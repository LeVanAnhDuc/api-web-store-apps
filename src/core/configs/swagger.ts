import type { Options } from "swagger-jsdoc";

import ENV from "./env";

/**
 * Swagger/OpenAPI Configuration
 * Centralized configuration for API documentation
 */

const PORT = ENV.APP_PORT || 3000;

export const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Apartment Web API",
      version: "1.0.0",
      description: `
RESTful API for Apartment Web Application.

## Authentication Flow
1. **Signup**: Send OTP → Verify OTP → Complete Profile
2. **Login**: Submit credentials → Receive tokens

## Response Format
All responses follow a consistent JSON structure.

### Success Response
\`\`\`json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "route": "/api/v1/...",
  "message": "Success message",
  "data": { ... }
}
\`\`\`

### Error Response
\`\`\`json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "route": "/api/v1/...",
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
\`\`\`
      `,
      contact: {
        name: "API Support",
        email: "support@apartment-web.com"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
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
      }
    ],
    components: {
      schemas: {
        // ============================================
        // Common Response Schemas
        // ============================================
        SuccessResponse: {
          type: "object",
          properties: {
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2025-01-15T10:30:00.000Z"
            },
            route: {
              type: "string",
              example: "/api/v1/auth/signup/send-otp"
            },
            message: {
              type: "string",
              example: "Operation successful"
            },
            data: {
              type: "object"
            }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2025-01-15T10:30:00.000Z"
            },
            route: {
              type: "string",
              example: "/api/v1/auth/signup/send-otp"
            },
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  example: "BAD_REQUEST"
                },
                message: {
                  type: "string",
                  example: "Error message"
                }
              }
            }
          }
        },
        ValidationErrorResponse: {
          type: "object",
          properties: {
            timestamp: {
              type: "string",
              format: "date-time"
            },
            route: {
              type: "string"
            },
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  example: "VALIDATION_ERROR"
                },
                message: {
                  type: "string",
                  example: "Validation failed"
                },
                fields: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/FieldError"
                  }
                }
              }
            }
          }
        },
        FieldError: {
          type: "object",
          properties: {
            field: {
              type: "string",
              example: "email"
            },
            message: {
              type: "string",
              example: "Email is required"
            }
          }
        },

        // ============================================
        // Signup Schemas
        // ============================================
        SendOtpRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
              description: "Email address to send OTP"
            }
          }
        },
        SendOtpSuccessData: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true
            },
            expiresIn: {
              type: "integer",
              example: 300,
              description: "OTP expiration time in seconds"
            },
            cooldownSeconds: {
              type: "integer",
              example: 60,
              description: "Cooldown before resend in seconds"
            }
          }
        },
        VerifyOtpRequest: {
          type: "object",
          required: ["email", "otp"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com"
            },
            otp: {
              type: "string",
              pattern: "^\\d{6}$",
              example: "123456",
              description: "6-digit OTP code"
            }
          }
        },
        VerifyOtpSuccessData: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true
            },
            sessionToken: {
              type: "string",
              example: "abc123...",
              description: "Session token for completing signup"
            },
            expiresIn: {
              type: "integer",
              example: 300,
              description: "Session expiration in seconds"
            }
          }
        },
        ResendOtpSuccessData: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true
            },
            expiresIn: {
              type: "integer",
              example: 300
            },
            cooldownSeconds: {
              type: "integer",
              example: 60
            },
            resendCount: {
              type: "integer",
              example: 1,
              description: "Number of times OTP has been resent"
            },
            maxResends: {
              type: "integer",
              example: 5,
              description: "Maximum allowed resends"
            }
          }
        },
        CompleteSignupRequest: {
          type: "object",
          required: [
            "email",
            "sessionToken",
            "password",
            "confirmPassword",
            "fullName",
            "gender",
            "dateOfBirth",
            "acceptTerms"
          ],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com"
            },
            sessionToken: {
              type: "string",
              example: "abc123...",
              description: "Token from verify-otp step"
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "SecurePass123!",
              description: "Min 8 chars, uppercase, lowercase, number, special"
            },
            confirmPassword: {
              type: "string",
              format: "password",
              example: "SecurePass123!"
            },
            fullName: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              example: "John Doe"
            },
            gender: {
              type: "string",
              enum: ["male", "female", "other", "prefer_not_to_say"],
              example: "male"
            },
            dateOfBirth: {
              type: "string",
              format: "date",
              example: "1990-01-15",
              description: "ISO date format (YYYY-MM-DD)"
            },
            acceptTerms: {
              type: "boolean",
              example: true,
              description: "Must be true to complete signup"
            }
          }
        },
        CompleteSignupSuccessData: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true
            },
            user: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  example: "507f1f77bcf86cd799439011"
                },
                email: {
                  type: "string",
                  example: "user@example.com"
                },
                fullName: {
                  type: "string",
                  example: "John Doe"
                }
              }
            },
            tokens: {
              type: "object",
              properties: {
                accessToken: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIs..."
                },
                refreshToken: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIs..."
                },
                expiresIn: {
                  type: "integer",
                  example: 900,
                  description: "Access token expiration in seconds"
                }
              }
            }
          }
        },
        CheckEmailSuccessData: {
          type: "object",
          properties: {
            available: {
              type: "boolean",
              example: true,
              description: "Whether email is available for registration"
            }
          }
        },

        // ============================================
        // Login Schemas
        // ============================================
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com"
            },
            password: {
              type: "string",
              format: "password",
              example: "SecurePass123!"
            }
          }
        },
        LoginSuccessData: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true
            },
            user: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  example: "507f1f77bcf86cd799439011"
                },
                email: {
                  type: "string",
                  example: "user@example.com"
                },
                fullName: {
                  type: "string",
                  example: "John Doe"
                }
              }
            },
            tokens: {
              type: "object",
              properties: {
                accessToken: {
                  type: "string"
                },
                refreshToken: {
                  type: "string"
                },
                expiresIn: {
                  type: "integer",
                  example: 900
                }
              }
            }
          }
        }
      },
      responses: {
        ValidationError: {
          description: "Validation failed - Invalid input data",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidationErrorResponse"
              }
            }
          }
        },
        BadRequest: {
          description: "Bad request - Business rule violation",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        Conflict: {
          description: "Conflict - Resource already exists",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              },
              example: {
                timestamp: "2025-01-15T10:30:00.000Z",
                route: "/api/v1/auth/signup/send-otp",
                error: {
                  code: "CONFLICT",
                  message: "Email already registered"
                }
              }
            }
          }
        },
        TooManyRequests: {
          description: "Too many requests - Rate limit exceeded",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              },
              example: {
                timestamp: "2025-01-15T10:30:00.000Z",
                route: "/api/v1/auth/signup/send-otp",
                error: {
                  code: "TOO_MANY_REQUESTS",
                  message: "Rate limit exceeded. Try again later."
                }
              }
            }
          }
        },
        Unauthorized: {
          description: "Unauthorized - Invalid credentials",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    }
  },
  apis: ["./src/modules/**/routes/*.ts", "./src/routes/*.ts"]
};
