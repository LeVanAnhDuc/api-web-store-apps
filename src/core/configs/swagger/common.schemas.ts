import type { OpenAPIV3 } from "openapi-types";

export const commonSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  // ===========================================================================
  // Success Response
  // ===========================================================================
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
        example: "/api/v1/auth/login"
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

  // ===========================================================================
  // Error Response
  // ===========================================================================
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
        example: "/api/v1/auth/login"
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

  // ===========================================================================
  // Validation Error Response
  // ===========================================================================
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

  // ===========================================================================
  // Field Error
  // ===========================================================================
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
  }
};

// ===========================================================================
// Common Response References
// ===========================================================================

export const commonResponses: Record<
  string,
  OpenAPIV3.ResponseObject | OpenAPIV3.ReferenceObject
> = {
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
  Unauthorized: {
    description: "Unauthorized - Invalid credentials",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ErrorResponse"
        }
      }
    }
  },
  Forbidden: {
    description: "Forbidden - Access denied",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ErrorResponse"
        }
      }
    }
  },
  NotFound: {
    description: "Not found - Resource does not exist",
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
          route: "/api/v1/auth/login",
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Rate limit exceeded. Try again later."
          }
        }
      }
    }
  }
};
