import { Router } from "express";
import { logoutController } from "@/modules/logout/controller";
import { authenticate } from "@/middlewares/auth";

const logoutRouter = Router();

logoutRouter.post("/", authenticate, logoutController.logout);

export default logoutRouter;
