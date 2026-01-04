import { Router } from "express";
import { logoutController } from "@/modules/logout/controller";
import { authenticate } from "@/shared/middlewares/auth";

const logoutRouter = Router();

logoutRouter.post("/logout", authenticate, logoutController);

export default logoutRouter;
