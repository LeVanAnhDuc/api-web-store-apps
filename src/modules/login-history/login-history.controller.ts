import { Router } from "express";
import type { Request } from "express";
import type { AuthGuard } from "@/middlewares/guards/auth.guard";
import type { AdminGuard } from "@/middlewares/guards/admin.guard";
import type { LoginHistoryService } from "./login-history.service";
import type {
  LoginHistoryQuery,
  LoginHistoryAdminQuery
} from "@/types/modules/login-history";
import type { HandlerResult } from "@/types/http";
import { STATUS_CODES } from "@/config/http";
import { asyncHandler, asyncGuardHandler } from "@/utils/async-handler";
import { validate } from "@/middlewares";
import {
  loginHistoryQuerySchema,
  loginHistoryAdminQuerySchema
} from "@/validators/schemas/login-history";

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    authId: string;
    email: string;
    roles: string;
  };
}

export class LoginHistoryController {
  public readonly userRouter = Router();
  public readonly adminRouter = Router();

  constructor(
    private readonly service: LoginHistoryService,
    private readonly auth: AuthGuard,
    private readonly adminGuard: AdminGuard
  ) {
    this.initUserRoutes();
    this.initAdminRoutes();
  }

  private initUserRoutes(): void {
    this.userRouter.get(
      "/",
      asyncGuardHandler(this.auth),
      validate(loginHistoryQuerySchema, "query"),
      asyncHandler(this.getMyHistory)
    );
  }

  private initAdminRoutes(): void {
    this.adminRouter.get(
      "/",
      asyncGuardHandler(this.auth),
      asyncGuardHandler(this.adminGuard),
      validate(loginHistoryAdminQuerySchema, "query"),
      asyncHandler(this.getAllHistory)
    );
  }

  private getMyHistory = async (
    req: AuthenticatedRequest
  ): Promise<HandlerResult> => {
    const { userId } = req.user;
    const query = req.query as unknown as LoginHistoryQuery;
    const data = await this.service.getMyLoginHistory(userId, query);
    return {
      data,
      message: "loginHistory:success.getMyHistory",
      statusCode: STATUS_CODES.OK
    };
  };

  private getAllHistory = async (
    req: AuthenticatedRequest
  ): Promise<HandlerResult> => {
    const query = req.query as unknown as LoginHistoryAdminQuery;
    const data = await this.service.getAllLoginHistory(query);
    return {
      data,
      message: "loginHistory:success.getAllHistory",
      statusCode: STATUS_CODES.OK
    };
  };
}
