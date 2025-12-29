/**
 * Login Routes
 * RESTful API endpoints for user authentication
 *
 * Note: Session management routes (logout, revoke) moved to logout module
 */

// libs
import { Router } from "express";

// controllers
import {
  loginController,
  sendOtpController,
  verifyOtpController,
  sendMagicLinkController,
  verifyMagicLinkController,
  refreshTokenController
} from "@/modules/login/controller";

// middleware
import { validate } from "@/shared/middlewares/validation";
import {
  getLoginRateLimiter,
  getLoginOtpIpRateLimiter,
  getLoginOtpEmailRateLimiter,
  getMagicLinkIpRateLimiter,
  getMagicLinkEmailRateLimiter
} from "@/shared/middlewares/rate-limit";

// schemas
import {
  loginSchema,
  otpSendSchema,
  otpVerifySchema,
  magicLinkSendSchema,
  magicLinkVerifySchema
} from "@/modules/login/schema";

const loginRouter = Router();

// =============================================================================
// Password Login
// =============================================================================

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login with password
 *     description: |
 *       Authenticate user with email and password.
 *
 *       **Rate Limits:**
 *       - 30 attempts per IP per 15 minutes
 *
 *       **Security:**
 *       - Account locked after 5 failed attempts (progressive lockout)
 *       - Passwords are verified using bcrypt
 *
 *       **On Success:**
 *       - Returns access token (15 min expiry)
 *       - Sets refresh token in HTTP-only cookie (7 days expiry)
 *     tags: [Auth - Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials or account locked
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
loginRouter.post(
  "/",
  (req, res, next) => getLoginRateLimiter()(req, res, next),
  validate(loginSchema, "body"),
  loginController
);

// =============================================================================
// OTP Login
// =============================================================================

/**
 * @swagger
 * /auth/otp/send:
 *   post:
 *     summary: Send OTP for passwordless login
 *     description: |
 *       Send a 6-digit OTP to the user's email for passwordless login.
 *
 *       **Rate Limits:**
 *       - 10 requests per IP per 15 minutes
 *       - 5 requests per email per 15 minutes
 *
 *       **Cooldown:**
 *       - 60 seconds between OTP requests
 *
 *       **OTP Expiry:**
 *       - 5 minutes
 *     tags: [Auth - OTP Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Cooldown not expired or validation error
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
loginRouter.post(
  "/otp/send",
  (req, res, next) => getLoginOtpIpRateLimiter()(req, res, next),
  (req, res, next) => getLoginOtpEmailRateLimiter()(req, res, next),
  validate(otpSendSchema, "body"),
  sendOtpController
);

/**
 * @swagger
 * /auth/otp/verify:
 *   post:
 *     summary: Verify OTP and login
 *     description: |
 *       Verify the OTP code and authenticate the user.
 *
 *       **Security:**
 *       - 5 failed attempts before lockout (15 minutes)
 *
 *       **On Success:**
 *       - Returns access token (15 min expiry)
 *       - Sets refresh token in HTTP-only cookie (7 days expiry)
 *     tags: [Auth - OTP Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid or expired OTP
 *       429:
 *         description: Too many failed attempts
 */
loginRouter.post(
  "/otp/verify",
  (req, res, next) => getLoginRateLimiter()(req, res, next),
  validate(otpVerifySchema, "body"),
  verifyOtpController
);

// =============================================================================
// Magic Link Login
// =============================================================================

/**
 * @swagger
 * /auth/magic-link/send:
 *   post:
 *     summary: Send magic link for passwordless login
 *     description: |
 *       Send a magic link to the user's email for passwordless login.
 *
 *       **Rate Limits:**
 *       - 10 requests per IP per 15 minutes
 *       - 5 requests per email per 15 minutes
 *
 *       **Cooldown:**
 *       - 60 seconds between requests
 *
 *       **Link Expiry:**
 *       - 15 minutes
 *     tags: [Auth - Magic Link Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Magic link sent successfully
 *       400:
 *         description: Cooldown not expired or validation error
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
loginRouter.post(
  "/magic-link/send",
  (req, res, next) => getMagicLinkIpRateLimiter()(req, res, next),
  (req, res, next) => getMagicLinkEmailRateLimiter()(req, res, next),
  validate(magicLinkSendSchema, "body"),
  sendMagicLinkController
);

/**
 * @swagger
 * /auth/magic-link/verify:
 *   post:
 *     summary: Verify magic link and login
 *     description: |
 *       Verify the magic link token and authenticate the user.
 *
 *       **On Success:**
 *       - Returns access token (15 min expiry)
 *       - Sets refresh token in HTTP-only cookie (7 days expiry)
 *     tags: [Auth - Magic Link Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, token]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid or expired magic link
 */
loginRouter.post(
  "/magic-link/verify",
  (req, res, next) => getLoginRateLimiter()(req, res, next),
  validate(magicLinkVerifySchema, "body"),
  verifyMagicLinkController
);

// =============================================================================
// Token Refresh
// =============================================================================

/**
 * @swagger
 * /auth/login/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: |
 *       Get a new access token using the refresh token from cookie.
 *
 *       **Authentication:**
 *       - Requires valid refresh token in HTTP-only cookie
 *
 *       **On Success:**
 *       - Returns new access token (15 min expiry)
 *     tags: [Auth - Token]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or missing refresh token
 *       403:
 *         description: Session revoked or expired
 */
loginRouter.post("/refresh", refreshTokenController);

export default loginRouter;
