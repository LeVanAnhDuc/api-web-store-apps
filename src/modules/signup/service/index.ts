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

export { sendOtp } from "./send-otp.service";

export { verifyOtp } from "./verify-otp.service";

export { resendOtp } from "./resend-otp.service";

export { completeSignup } from "./complete-signup.service";

export { checkEmail } from "./check-email.service";
