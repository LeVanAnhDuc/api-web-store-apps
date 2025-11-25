// libs
import { Router } from "express";
// controller
import { loginController } from "@/modules/login/controller";
// middleware
import { validate } from "@/shared/middlewares/validation";
// schema
import { loginSchema } from "@/modules/login/schema";

const loginRouter = Router();

loginRouter.post("/", validate(loginSchema, "body"), loginController);

export default loginRouter;
