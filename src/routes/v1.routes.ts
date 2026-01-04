import { Router } from "express";
import signupRouter from "@/modules/signup/routes";
import loginRouter from "@/modules/login/routes";
import logoutRouter from "@/modules/logout/routes";
import tokenRouter from "@/modules/token/routes";

const router = Router();

router.use("/auth/signup", signupRouter);
router.use("/auth/login", loginRouter);
router.use("/auth", logoutRouter);
router.use("/auth/token", tokenRouter);

export default router;
