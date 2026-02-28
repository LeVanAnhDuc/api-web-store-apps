import { Router } from "express";
import { tokenController } from "@/modules/token/controller";

const tokenRouter = Router();

tokenRouter.post("/refresh", tokenController.refreshToken);

export default tokenRouter;
