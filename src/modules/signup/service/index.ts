/**
 * Signup Service Layer
 * Barrel export for all signup use case services
 *
 * Architecture:
 * - Each service file = 1 use case (SRP)
 * - Services speak business language, not technical
 * - Services do NOT: Query DB directly, Validate format, Map DTOs
 * - Side effects are controlled through notifier layer
 */

// Use Case: Send OTP for first time
export { sendOtp } from "./send-otp.service";

// Use Case: Verify OTP code
export { verifyOtp } from "./verify-otp.service";

// Use Case: Resend OTP (tracks resend count)
export { resendOtp } from "./resend-otp.service";

// Use Case: Complete signup with profile
export { completeSignup } from "./complete-signup.service";

// Use Case: Check email availability
export { checkEmail } from "./check-email.service";
