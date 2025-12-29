// libs
import { Router } from "express";
// routes
import signupRouter from "@/modules/signup/routes";
import loginRouter from "@/modules/login/routes";
import logoutRouter from "@/modules/logout/routes";

const router = Router();

router.use("/auth/signup", signupRouter);
router.use("/auth/login", loginRouter);
router.use("/auth", logoutRouter);

export default router;
