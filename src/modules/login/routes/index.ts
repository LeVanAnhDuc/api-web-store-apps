// libs
import { Router } from "express";
// controller
import { loginController } from "@/modules/login/controller";
// middleware
import { validate } from "@/shared/middlewares/validation";
import { getLoginRateLimiter } from "@/shared/middlewares/rate-limit";
// schema
import { loginSchema } from "@/modules/login/schema";

const loginRouter = Router();

loginRouter.post(
  "/",
  (req, res, next) => getLoginRateLimiter()(req, res, next),
  validate(loginSchema, "body"),
  loginController
);

export default loginRouter;
