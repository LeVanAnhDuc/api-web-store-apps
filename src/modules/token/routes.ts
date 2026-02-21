import { Router } from "express";
import { refreshTokenController } from "@/modules/token/controller";

const tokenRouter = Router();

tokenRouter.post("/refresh", refreshTokenController);

export default tokenRouter;
