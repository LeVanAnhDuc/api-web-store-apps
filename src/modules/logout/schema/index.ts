/**
 * Logout Validation Schemas
 * Joi schemas for logout and session management endpoints
 */

// libs
import Joi from "joi";

// =============================================================================
// Session Management
// =============================================================================

/**
 * Session ID param schema
 * Validates session ID in URL params
 */
export const sessionIdParamSchema = Joi.object({
  sessionId: Joi.string()
    .length(24)
    .pattern(/^[a-f0-9]+$/)
    .required()
    .messages({
      "string.empty": "logout:validation.sessionIdRequired",
      "string.length": "logout:validation.sessionIdInvalid",
      "string.pattern.base": "logout:validation.sessionIdInvalid",
      "any.required": "logout:validation.sessionIdRequired"
    })
});
