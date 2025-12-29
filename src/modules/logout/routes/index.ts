/**
 * Logout & Session Management Routes
 * RESTful API endpoints for logout and session management
 */

// libs
import { Router } from "express";

// controllers
import {
  getSessionsController,
  logoutController,
  revokeSessionController,
  revokeAllOtherSessionsController,
  revokeAllSessionsController
} from "@/modules/logout/controller";

// middleware
import { validate } from "@/shared/middlewares/validation";
import { authenticate } from "@/shared/middlewares/auth";

// schemas
import { sessionIdParamSchema } from "@/modules/logout/schema";

const logoutRouter = Router();

// =============================================================================
// Session Management (Protected Routes)
// =============================================================================

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: Get all active sessions
 *     description: |
 *       Get a list of all active sessions for the current user.
 *       Returns device info, location, and last active time.
 *     tags: [Auth - Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SessionResponse'
 *                     total:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
logoutRouter.get("/sessions", authenticate, getSessionsController);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout (revoke current session)
 *     description: |
 *       Revoke the current session and clear refresh token cookie.
 *       This only logs out the current device.
 *     tags: [Auth - Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 */
logoutRouter.post("/logout", authenticate, logoutController);

/**
 * @swagger
 * /auth/sessions/others:
 *   delete:
 *     summary: Revoke all other sessions
 *     description: |
 *       Revoke all sessions except the current one.
 *       Useful for "logout from all other devices" feature.
 *     tags: [Auth - Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All other sessions revoked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     revokedCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
logoutRouter.delete(
  "/sessions/others",
  authenticate,
  revokeAllOtherSessionsController
);

/**
 * @swagger
 * /auth/sessions:
 *   delete:
 *     summary: Revoke all sessions
 *     description: |
 *       Revoke all sessions including the current one.
 *       Logs out the user from all devices.
 *     tags: [Auth - Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     revokedCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
logoutRouter.delete("/sessions", authenticate, revokeAllSessionsController);

/**
 * @swagger
 * /auth/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke a specific session
 *     description: |
 *       Revoke a specific session by ID.
 *       Cannot revoke the current session through this endpoint (use logout instead).
 *     tags: [Auth - Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID to revoke (24-character hex string)
 *     responses:
 *       200:
 *         description: Session revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *       400:
 *         description: Cannot revoke current session
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 */
logoutRouter.delete(
  "/sessions/:sessionId",
  authenticate,
  validate(sessionIdParamSchema, "params"),
  revokeSessionController
);

export default logoutRouter;
