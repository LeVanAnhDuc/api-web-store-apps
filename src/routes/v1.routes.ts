import { Router } from "express";
import signupRouter from "@/modules/signup/routes";
import loginRouter from "@/modules/login/routes";
import logoutRouter from "@/modules/logout/routes";
import tokenRouter from "@/modules/token/routes";
import unlockAccountRouter from "@/modules/unlock-account/routes";

const router = Router();

router.use("/auth/signup", signupRouter);
router.use("/auth/login", loginRouter);
router.use("/auth/logout", logoutRouter);
router.use("/auth/token", tokenRouter);
router.use("/auth/unlock", unlockAccountRouter);

export default router;
