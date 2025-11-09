export interface SendOtpResponse {
  success: true;
  sessionId: string;
  expiresIn: number;
}
