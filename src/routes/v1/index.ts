import { Router } from "express";

interface V1Routers {
  signupRouter: Router;
  loginRouter: Router;
  logoutRouter: Router;
  tokenRouter: Router;
  unlockAccountRouter: Router;
  forgotPasswordRouter: Router;
}

export const createV1Router = (routers: V1Routers): Router => {
  const v1Router = Router();

  v1Router.use("/auth/signup", routers.signupRouter);
  v1Router.use("/auth/login", routers.loginRouter);
  v1Router.use("/auth/logout", routers.logoutRouter);
  v1Router.use("/auth/token", routers.tokenRouter);
  v1Router.use("/auth/unlock", routers.unlockAccountRouter);
  v1Router.use("/auth/forgot-password", routers.forgotPasswordRouter);

  return v1Router;
};
