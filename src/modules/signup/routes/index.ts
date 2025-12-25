/**
 * Signup Routes
 * RESTful API endpoints for user registration flow
 *
 * API Contract:
 * =============
 *
 * All responses follow consistent JSON format:
 *
 * Success Response:
 * {
 *   "timestamp": "ISO 8601 timestamp",
 *   "route": "/api/v1/signup/...",
 *   "message": "Success message (i18n)",
 *   "data": { ... response data ... }
 * }
 *
 * Error Response:
 * {
 *   "timestamp": "ISO 8601 timestamp",
 *   "route": "/api/v1/signup/...",
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Error message (i18n)",
 *     "fields": [{ "field": "fieldName", "message": "Field error" }] // Only for validation errors
 *   }
 * }
 *
 * Error Codes:
 * - VALIDATION_ERROR (400): Invalid input data
 * - BAD_REQUEST (400): Business rule violation
 * - CONFLICT (409): Email already registered
 * - TOO_MANY_REQUESTS (429): Rate limit exceeded
 */

import { Router } from "express";

// controllers
import {
  sendOtpController,
  verifyOtpController,
  resendOtpController,
  completeSignupController,
  checkEmailController
} from "@/modules/signup/controller";

// middlewares
import { validate } from "@/shared/middlewares/validation";
import {
  getSignupIpRateLimiter,
  getSignupEmailRateLimiter,
  getCheckEmailRateLimiter
} from "@/shared/middlewares/rate-limit";

// schemas
import {
  sendOtpSchema,
  resendOtpSchema,
  verifyOtpSchema,
  completeSignupSchema,
  checkEmailSchema
} from "@/modules/signup/schema";

const signupRouter = Router();

/**
 * POST /signup/send-otp
 * Step 1: Send OTP to email for verification
 *
 * Request Body:
 *   { "email": "user@example.com" }
 *
 * Success Response (200):
 *   { "data": { "success": true, "expiresIn": 300, "cooldownSeconds": 60 } }
 *
 * Errors:
 *   400 VALIDATION_ERROR - Invalid email format
 *   409 CONFLICT - Email already registered
 *   429 TOO_MANY_REQUESTS - Rate limit exceeded
 */
signupRouter.post(
  "/send-otp",
  (req, res, next) => getSignupIpRateLimiter()(req, res, next),
  (req, res, next) => getSignupEmailRateLimiter()(req, res, next),
  validate(sendOtpSchema, "body"),
  sendOtpController
);

/**
 * POST /signup/verify-otp
 * Step 2: Verify OTP code submitted by user
 *
 * Request Body:
 *   { "email": "user@example.com", "otp": "123456" }
 *
 * Success Response (200):
 *   { "data": { "success": true, "sessionToken": "...", "expiresIn": 300 } }
 *
 * Errors:
 *   400 BAD_REQUEST - Invalid OTP or account locked
 *   400 VALIDATION_ERROR - Missing required fields
 */
signupRouter.post(
  "/verify-otp",
  validate(verifyOtpSchema, "body"),
  verifyOtpController
);

/**
 * POST /signup/resend-otp
 * Alternative Step 2: Request new OTP (tracks resend count)
 *
 * Request Body:
 *   { "email": "user@example.com" }
 *
 * Success Response (200):
 *   { "data": { "success": true, "expiresIn": 300, "cooldownSeconds": 60, "resendCount": 1, "maxResends": 5 } }
 *
 * Errors:
 *   400 BAD_REQUEST - Cooldown active or resend limit exceeded
 *   409 CONFLICT - Email already registered
 *   429 TOO_MANY_REQUESTS - Rate limit exceeded
 */
signupRouter.post(
  "/resend-otp",
  (req, res, next) => getSignupIpRateLimiter()(req, res, next),
  (req, res, next) => getSignupEmailRateLimiter()(req, res, next),
  validate(resendOtpSchema, "body"),
  resendOtpController
);

/**
 * POST /signup/complete
 * Step 3: Complete signup with user profile data
 *
 * Request Body:
 *   {
 *     "email": "user@example.com",
 *     "sessionToken": "...",
 *     "password": "...",
 *     "confirmPassword": "...",
 *     "fullName": "John Doe",
 *     "gender": "male|female|other|prefer_not_to_say",
 *     "dateOfBirth": "1990-01-15",
 *     "acceptTerms": true
 *   }
 *
 * Success Response (200):
 *   {
 *     "data": {
 *       "success": true,
 *       "user": { "id": "...", "email": "...", "fullName": "..." },
 *       "tokens": { "accessToken": "...", "refreshToken": "...", "expiresIn": 900 }
 *     }
 *   }
 *
 * Errors:
 *   400 BAD_REQUEST - Invalid session or validation error
 *   400 VALIDATION_ERROR - Invalid input data
 *   409 CONFLICT - Email already registered
 */
signupRouter.post(
  "/complete",
  validate(completeSignupSchema, "body"),
  completeSignupController
);

/**
 * GET /signup/check-email/:email
 * Utility: Check if email is available for registration
 *
 * URL Params:
 *   :email - Email address to check
 *
 * Success Response (200):
 *   { "data": { "available": true|false } }
 *
 * Errors:
 *   400 VALIDATION_ERROR - Invalid email format
 *   429 TOO_MANY_REQUESTS - Rate limit exceeded
 */
signupRouter.get(
  "/check-email/:email",
  (req, res, next) => getCheckEmailRateLimiter()(req, res, next),
  validate(checkEmailSchema, "params"),
  checkEmailController
);

export default signupRouter;
