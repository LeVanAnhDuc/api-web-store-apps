// libs
import { Router } from "express";
// routes
import signupRouter from "@/modules/signup/routes";
import loginRouter from "@/modules/login/routes";

const router = Router();

router.use("/auth/signup", signupRouter);
router.use("/auth/login", loginRouter);

export default router;
