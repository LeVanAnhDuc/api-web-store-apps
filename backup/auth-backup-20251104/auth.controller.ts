// // libs
// import type { Request, Response } from "express";
// // services
// import type AuthService from "./auth.service";
// // responses
// import { CreatedSuccess, OkSuccess } from "@/core/responses/success.response";
// // others
// import { asyncHandler } from "@/core/utils/asyncHandler";

// class AuthController {
//   private readonly authService: AuthService;

//   constructor(authService: AuthService) {
//     this.authService = authService;
//   }

//   /**
//    * Handle user login
//    */
//   login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
//     const result = await this.authService.login(req.body);
//     new OkSuccess(result).send(res);
//   });

//   /**
//    * Handle user signup
//    */
//   signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
//     const result = await this.authService.signup(req.body);
//     new CreatedSuccess(result).send(res);
//   });

//   /**
//    * Handle signup verification
//    */
//   verifySignup = asyncHandler(
//     async (req: Request, res: Response): Promise<void> => {
//       const result = await this.authService.verifySignup(req.body);
//       new OkSuccess(result).send(res);
//     }
//   );

//   /**
//    * Handle resend OTP for signup
//    */
//   reSendOTPSignup = asyncHandler(
//     async (req: Request, res: Response): Promise<void> => {
//       const result = await this.authService.reSendOTPSignup(req.body);
//       new OkSuccess(result).send(res);
//     }
//   );

//   /**
//    * Handle user logout
//    */
//   logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
//     const result = await this.authService.logout({ userId: req.params.id });
//     new OkSuccess(result).send(res);
//   });

//   /**
//    * Handle refresh access token
//    */
//   refreshAccessToken = asyncHandler(
//     async (req: Request, res: Response): Promise<void> => {
//       const result = await this.authService.refreshAccessToken(req);
//       new CreatedSuccess(result).send(res);
//     }
//   );

//   /**
//    * Handle send OTP for forgot password
//    */
//   sendOtpForgotPassword = asyncHandler(
//     async (req: Request, res: Response): Promise<void> => {
//       const result = await this.authService.sendOtpForgotPassword(
//         req.body,
//         res
//       );
//       new OkSuccess(result).send(res);
//     }
//   );

//   /**
//    * Handle confirm OTP for forgot password
//    */
//   confirmOpForgotPassword = asyncHandler(
//     async (req: Request, res: Response): Promise<void> => {
//       const result = await this.authService.confirmOpForgotPassword(
//         req.body,
//         req
//       );
//       new OkSuccess(result).send(res);
//     }
//   );

//   /**
//    * Handle update password after forgot password
//    */
//   updatePasswordForgotPassword = asyncHandler(
//     async (req: Request, res: Response): Promise<void> => {
//       const result = await this.authService.updatePasswordForgotPassword(
//         req.body,
//         req
//       );
//       new OkSuccess(result).send(res);
//     }
//   );
// }

// export default AuthController;
