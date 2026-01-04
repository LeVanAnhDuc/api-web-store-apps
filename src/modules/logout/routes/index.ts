/**
 * Logout Routes (Simplified)
 * Only logout endpoint - clear refresh token cookie
 */

// libs
import { Router } from "express";

// controllers
import { logoutController } from "@/modules/logout/controller";

// middleware
import { authenticate } from "@/shared/middlewares/auth";

const logoutRouter = Router();

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     description: |
 *       Clear refresh token cookie and logout.
 *       Client should also delete access token from memory.
 *     tags: [Auth]
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

export default logoutRouter;
