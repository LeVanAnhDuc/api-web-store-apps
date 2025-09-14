// libs
import { Request, Response } from 'express';
// services
import AuthService from '../services/auth.service';
// others
import { CreatedSuccess, OkSuccess } from '../responses/success.response';

class AuthController {
  login = async (req: Request, res: Response) => {
    return new OkSuccess(await AuthService.login(req.body, res)).send(res);
  };

  signup = async (req: Request, res: Response) => {
    return new CreatedSuccess(await AuthService.signup(req.body)).send(res);
  };

  verifySignup = async (req: Request, res: Response) => {
    return new OkSuccess(await AuthService.verifySignup(req.body)).send(res);
  };

  reSendOTPSignup = async (req: Request, res: Response) => {
    return new OkSuccess(await AuthService.reSendOTPSignup(req.body)).send(res);
  };

  logOut = async (req: Request, res: Response) => {
    return new OkSuccess(await AuthService.logOut(res)).send(res);
  };

  refreshAccessToken = async (req: Request, res: Response) => {
    return new CreatedSuccess(await AuthService.refreshAccessToken(res, req)).send(res);
  };

  sendOtpForgotPassword = async (req: Request, res: Response) => {
    return new OkSuccess(await AuthService.sendOtpForgotPassword(req.body, res)).send(res);
  };

  confirmOpForgotPassword = async (req: Request, res: Response) => {
    return new OkSuccess(await AuthService.confirmOpForgotPassword(req.body, req)).send(res);
  };

  updatePasswordForgotPassword = async (req: Request, res: Response) => {
    return new OkSuccess(await AuthService.updatePasswordForgotPassword(req.body, req)).send(res);
  };
}

export default new AuthController();
