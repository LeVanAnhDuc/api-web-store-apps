/**
 * Login Routes
 * RESTful API endpoints for user authentication
 */

// libs
import { Router } from "express";
// controller
import { loginController } from "@/modules/login/controller";
// middleware
import { validate } from "@/shared/middlewares/validation";
import { getLoginRateLimiter } from "@/shared/middlewares/rate-limit";
// schema
import { loginSchema } from "@/modules/login/schema";

const loginRouter = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: |
 *       Authenticate user with email and password.
 *
 *       **Rate Limits:**
 *       - 5 attempts per IP per 15 minutes
 *       - 5 attempts per email per 15 minutes
 *
 *       **Security:**
 *       - Account locked after 5 failed attempts
 *       - Lockout duration: 15 minutes
 *       - Passwords are verified using bcrypt
 *
 *       **On Success:**
 *       - Returns access token (15 min expiry)
 *       - Returns refresh token (7 days expiry)
 *       - Tokens set in HTTP-only cookies
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
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginSuccessData'
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *             description: HTTP-only cookies containing access and refresh tokens
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials or account locked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidCredentials:
 *                 summary: Invalid credentials
 *                 value:
 *                   timestamp: "2025-01-15T10:30:00.000Z"
 *                   route: "/api/v1/auth/login"
 *                   error:
 *                     code: "UNAUTHORIZED"
 *                     message: "Invalid email or password. 4 attempts remaining."
 *               accountLocked:
 *                 summary: Account locked
 *                 value:
 *                   timestamp: "2025-01-15T10:30:00.000Z"
 *                   route: "/api/v1/auth/login"
 *                   error:
 *                     code: "UNAUTHORIZED"
 *                     message: "Account locked due to too many failed attempts. Try again in 15 minutes."
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
loginRouter.post(
  "/",
  (req, res, next) => getLoginRateLimiter()(req, res, next),
  validate(loginSchema, "body"),
  loginController
);

export default loginRouter;
