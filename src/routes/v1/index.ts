import { Router } from "express";
import { signupRouter } from "@/modules/signup/signup.module";
import { loginRouter } from "@/modules/login/login.module";
import { logoutRouter } from "@/modules/logout/logout.module";
import { tokenRouter } from "@/modules/token/token.module";
import { unlockAccountRouter } from "@/modules/unlock-account/unlock-account.module";

const v1Router = Router();

v1Router.use("/auth/signup", signupRouter);
v1Router.use("/auth/login", loginRouter);
v1Router.use("/auth/logout", logoutRouter);
v1Router.use("/auth/token", tokenRouter);
v1Router.use("/auth/unlock", unlockAccountRouter);

export default v1Router;
