// libs
import type { Request, Response } from "express";
// services
import type AuthService from "./auth.service";
// others
import { CreatedSuccess, OkSuccess } from "@/responses/success.response";

class AuthController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly authService: AuthService) {}

  public login = async (req: Request, res: Response) =>
    new OkSuccess(await this.authService.login(req.body)).send(res);

  public signup = async (req: Request, res: Response) =>
    new CreatedSuccess(await this.authService.signup(req.body)).send(res);

  public verifySignup = async (req: Request, res: Response) =>
    new OkSuccess(await this.authService.verifySignup(req.body)).send(res);

  public reSendOTPSignup = async (req: Request, res: Response) =>
    new OkSuccess(await this.authService.reSendOTPSignup(req.body)).send(res);

  public logout = async (req: Request, res: Response) =>
    new OkSuccess(
      await this.authService.logout({ userId: req.params.id })
    ).send(res);

  public refreshAccessToken = async (req: Request, res: Response) =>
    new CreatedSuccess(await this.authService.refreshAccessToken(req)).send(
      res
    );

  public sendOtpForgotPassword = async (req: Request, res: Response) =>
    new OkSuccess(
      await this.authService.sendOtpForgotPassword(req.body, res)
    ).send(res);

  public confirmOpForgotPassword = async (req: Request, res: Response) =>
    new OkSuccess(
      await this.authService.confirmOpForgotPassword(req.body, req)
    ).send(res);

  public updatePasswordForgotPassword = async (req: Request, res: Response) =>
    new OkSuccess(
      await this.authService.updatePasswordForgotPassword(req.body, req)
    ).send(res);
}

export default AuthController;
