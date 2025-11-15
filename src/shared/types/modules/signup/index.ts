export interface SendOtpResponse {
  success: true;
  expiresIn: number;
}

export interface VerifyOtpResponse {
  success: true;
  sessionId: string;
  expiresIn: number;
}

export interface CompleteSignupResponse {
  success: true;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresIn: number;
  };
}
