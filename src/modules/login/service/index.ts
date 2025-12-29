/**
 * Login Service Index
 * Re-exports all login-related services
 *
 * Services follow SRP - each service handles one use case:
 * - Password Login: Email/password authentication
 * - OTP Login: Send and verify OTP for passwordless login
 * - Magic Link Login: Send and verify magic link for passwordless login
 * - Token Refresh: Refresh access token using refresh token
 *
 * Note: Session management (logout, revoke) moved to logout module
 */

// Password Login
export { passwordLogin } from "./password-login.service";

// OTP Login
export { sendLoginOtp } from "./otp-send.service";
export { verifyLoginOtpService } from "./otp-verify.service";

// Magic Link Login
export { sendMagicLink } from "./magic-link-send.service";
export { verifyMagicLink } from "./magic-link-verify.service";

// Token Refresh
export { refreshAccessToken } from "./token-refresh.service";
