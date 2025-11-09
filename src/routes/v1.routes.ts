// libs
import { Router } from "express";
// routes
import signupRouter from "@/modules/signup/routes";

const router = Router();

router.use("/auth/signup", signupRouter);

export default router;
