// libs
import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";

// types
import type { LoginHistoryService } from "./login-history.service";
import type {
  LoginHistoryQuery,
  LoginHistoryAdminQuery
} from "@/types/modules/login-history";

// config
import { OkSuccess } from "@/config/responses/success";

// utils
import { asyncHandler } from "@/utils/async-handler";

// middlewares
import { queryPipe } from "@/middlewares";

// validators
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
    private readonly authGuard: RequestHandler,
    private readonly adminGuard: RequestHandler
  ) {
    this.initUserRoutes();
    this.initAdminRoutes();
  }

  private initUserRoutes(): void {
    this.userRouter.get(
      "/",
      this.authGuard,
      queryPipe(loginHistoryQuerySchema),
      asyncHandler(this.getMyHistory)
    );
  }

  private initAdminRoutes(): void {
    this.adminRouter.get(
      "/",
      this.authGuard,
      this.adminGuard,
      queryPipe(loginHistoryAdminQuerySchema),
      asyncHandler(this.getAllHistory)
    );
  }

  private getMyHistory = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const { userId } = req.user;
    const query = req.query as unknown as LoginHistoryQuery;
    const data = await this.service.getMyLoginHistory(userId, query);
    new OkSuccess({ data, message: "loginHistory:success.getMyHistory" }).send(
      req,
      res
    );
  };

  private getAllHistory = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const query = req.query as unknown as LoginHistoryAdminQuery;
    const data = await this.service.getAllLoginHistory(query);
    new OkSuccess({
      data,
      message: "loginHistory:success.getAllHistory"
    }).send(req, res);
  };
}
