// libs
import { Router } from "express";
// routers
import authRouter from "./auth/auth.router";

const router = Router();

router.use("/auth", authRouter);

export default router;
