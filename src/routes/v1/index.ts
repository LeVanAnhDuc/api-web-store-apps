import { Router } from "express";
import signupRouter from "@/routes/modules/signup.route";
import loginRouter from "@/routes/modules/login.route";
import logoutRouter from "@/routes/modules/logout.route";
import tokenRouter from "@/routes/modules/token.route";
import unlockAccountRouter from "@/routes/modules/unlock-account.route";

const v1Router = Router();

v1Router.use("/auth/signup", signupRouter);
v1Router.use("/auth/login", loginRouter);
v1Router.use("/auth/logout", logoutRouter);
v1Router.use("/auth/token", tokenRouter);
v1Router.use("/auth/unlock", unlockAccountRouter);

export default v1Router;
