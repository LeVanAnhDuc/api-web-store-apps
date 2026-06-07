// types
import type { Request, Response } from "express";
import type { WebAppService } from "./web-app.service";
import type { AdminAppsQueryRequest } from "./types";
// common
import { OkSuccess } from "@/common/responses";

export class WebAppController {
  constructor(private readonly service: WebAppService) {}

  listApps = async (
    req: AdminAppsQueryRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.listApps(req.query);
    new OkSuccess({
      data,
      message: "webApp:success.listApps"
    }).send(req, res);
  };

  listCategories = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.listCategories();
    new OkSuccess({
      data,
      message: "webApp:success.listCategories"
    }).send(req, res);
  };
}
