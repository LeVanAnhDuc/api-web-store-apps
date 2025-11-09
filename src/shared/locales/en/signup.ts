export const SIGNUP_EN = {
  ERRORS: {
    EMAIL_REQUIRED: "Email is required",
    INVALID_EMAIL_FORMAT: "Invalid email format",
    EMAIL_ALREADY_EXISTS: "Email is already registered",
    RATE_LIMIT_EXCEEDED: "You have exceeded the allowed number of attempts",
    RESEND_COOLDOWN: "Please wait before resending OTP",
    EMAIL_SEND_FAILED: "Failed to send email. Please try again later"
  },
  SUCCESS: {
    OTP_SENT: "OTP code has been sent to your email"
  }
} as const;
