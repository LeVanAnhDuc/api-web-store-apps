import { Router } from "express";
import {
  loginController,
  sendOtpController,
  verifyOtpController,
  sendMagicLinkController,
  verifyMagicLinkController,
  refreshTokenController
} from "@/modules/login/controller";
import { validate } from "@/shared/middlewares/validation";
import { getRateLimiterMiddleware } from "@/loaders/rate-limiter.loader";
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
 *     summary: Login with email and password
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
 *       **Returns:**
 *       - Access token (15 min expiry)
 *       - Refresh token in HTTP-only cookie (7 days expiry)
 *       - ID token
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Account locked due to too many failed attempts
 *       401:
 *         description: Invalid credentials
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
loginRouter.post(
  "/",
  (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
  validate(loginSchema, "body"),
  loginController
);

// =============================================================================
// OTP Login
// =============================================================================

/**
 * @swagger
 * /auth/login/otp/send:
 *   post:
 *     summary: Send OTP for passwordless login
 *     description: |
 *       Send a 6-digit OTP to the user's email for passwordless login.
 *
 *       **Rate Limits:**
 *       - 10 requests per IP per 15 minutes
 *       - 5 requests per email per 15 minutes
 *
 *       **Cooldown:** 60 seconds between requests
 *
 *       **OTP Expiry:** 5 minutes
 *     tags: [Auth - Login]
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
 *         description: Cooldown not expired
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
loginRouter.post(
  "/otp/send",
  (req, res, next) => getRateLimiterMiddleware().loginOtpByIp(req, res, next),
  (req, res, next) =>
    getRateLimiterMiddleware().loginOtpByEmail(req, res, next),
  validate(otpSendSchema, "body"),
  sendOtpController
);

/**
 * @swagger
 * /auth/login/otp/verify:
 *   post:
 *     summary: Verify OTP and login
 *     description: |
 *       Verify the OTP code and authenticate the user.
 *
 *       **Security:**
 *       - 5 failed attempts before lockout (15 minutes)
 *
 *       **Returns:**
 *       - Access token (15 min expiry)
 *       - Refresh token in HTTP-only cookie (7 days expiry)
 *       - ID token
 *     tags: [Auth - Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OtpVerifyRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: OTP verification locked
 *       401:
 *         description: Invalid or expired OTP
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
loginRouter.post(
  "/otp/verify",
  (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
  validate(otpVerifySchema, "body"),
  verifyOtpController
);

// =============================================================================
// Magic Link Login
// =============================================================================

/**
 * @swagger
 * /auth/login/magic-link/send:
 *   post:
 *     summary: Send magic link for passwordless login
 *     description: |
 *       Send a magic link to the user's email for passwordless login.
 *
 *       **Rate Limits:**
 *       - 10 requests per IP per 15 minutes
 *       - 5 requests per email per 15 minutes
 *
 *       **Cooldown:** 60 seconds between requests
 *
 *       **Link Expiry:** 15 minutes
 *     tags: [Auth - Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MagicLinkSendRequest'
 *     responses:
 *       200:
 *         description: Magic link sent successfully
 *       400:
 *         description: Cooldown not expired
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
loginRouter.post(
  "/magic-link/send",
  (req, res, next) => getRateLimiterMiddleware().magicLinkByIp(req, res, next),
  (req, res, next) =>
    getRateLimiterMiddleware().magicLinkByEmail(req, res, next),
  validate(magicLinkSendSchema, "body"),
  sendMagicLinkController
);

/**
 * @swagger
 * /auth/login/magic-link/verify:
 *   post:
 *     summary: Verify magic link and login
 *     description: |
 *       Verify the magic link token and authenticate the user.
 *
 *       **Returns:**
 *       - Access token (15 min expiry)
 *       - Refresh token in HTTP-only cookie (7 days expiry)
 *       - ID token
 *     tags: [Auth - Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MagicLinkVerifyRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid or expired magic link
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
loginRouter.post(
  "/magic-link/verify",
  (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
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
 *       Get a new access token using the refresh token from HTTP-only cookie.
 *
 *       **Authentication:**
 *       - Requires valid refresh token in HTTP-only cookie
 *
 *       **Returns:**
 *       - New access token (15 min expiry)
 *       - New ID token
 *     tags: [Auth - Login]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       401:
 *         description: Refresh token required
 *       403:
 *         description: Invalid refresh token
 */
loginRouter.post("/refresh", refreshTokenController);

export default loginRouter;
