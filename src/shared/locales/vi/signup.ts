export const SIGNUP_VI = {
  ERRORS: {
    EMAIL_REQUIRED: "Email là bắt buộc",
    INVALID_EMAIL_FORMAT: "Email không hợp lệ",
    EMAIL_ALREADY_EXISTS: "Email đã được đăng ký",
    RATE_LIMIT_EXCEEDED: "Bạn đã vượt quá số lần thử cho phép",
    RESEND_COOLDOWN: "Vui lòng đợi trước khi gửi lại OTP",
    EMAIL_SEND_FAILED: "Không thể gửi email. Vui lòng thử lại sau"
  },
  SUCCESS: {
    OTP_SENT: "Mã OTP đã được gửi đến email"
  }
} as const;
