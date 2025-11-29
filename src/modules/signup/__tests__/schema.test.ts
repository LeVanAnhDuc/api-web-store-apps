/**
 * Unit tests for Signup Schema Validation
 *
 * Test scenarios covered:
 * 1. sendOtpSchema - Email validation
 * 2. verifyOtpSchema - Email + OTP validation
 * 3. completeSignupSchema - Full registration validation
 */

import {
  sendOtpSchema,
  verifyOtpSchema,
  completeSignupSchema
} from "../schema";

describe("Signup Schema Validation", () => {
  /*
   * ============================================================================
   * SEND OTP SCHEMA
   * ============================================================================
   */
  describe("sendOtpSchema", () => {
    describe("Valid input", () => {
      it("should pass với email hợp lệ", () => {
        const result = sendOtpSchema.validate({
          email: "test@example.com"
        });

        expect(result.error).toBeUndefined();
      });

      it("should pass với email có subdomain", () => {
        const result = sendOtpSchema.validate({
          email: "user@mail.example.com"
        });

        expect(result.error).toBeUndefined();
      });

      it("should pass với email có plus sign", () => {
        const result = sendOtpSchema.validate({
          email: "user+tag@example.com"
        });

        expect(result.error).toBeUndefined();
      });
    });

    describe("Invalid input", () => {
      it("should reject email rỗng", () => {
        const result = sendOtpSchema.validate({
          email: ""
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "auth:validation.emailRequired"
        );
      });

      it("should reject email thiếu @", () => {
        const result = sendOtpSchema.validate({
          email: "testexample.com"
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "auth:validation.emailInvalid"
        );
      });

      it("should reject khi thiếu email field", () => {
        const result = sendOtpSchema.validate({});

        expect(result.error).toBeDefined();
      });
    });
  });

  /*
   * ============================================================================
   * VERIFY OTP SCHEMA
   * ============================================================================
   */
  describe("verifyOtpSchema", () => {
    describe("Valid input", () => {
      it("should pass với email và OTP 6 số hợp lệ", () => {
        const result = verifyOtpSchema.validate({
          email: "test@example.com",
          otp: "123456"
        });

        expect(result.error).toBeUndefined();
      });

      it("should pass với OTP bắt đầu bằng 0", () => {
        const result = verifyOtpSchema.validate({
          email: "test@example.com",
          otp: "012345"
        });

        expect(result.error).toBeUndefined();
      });
    });

    describe("Invalid OTP", () => {
      it("should reject OTP rỗng", () => {
        const result = verifyOtpSchema.validate({
          email: "test@example.com",
          otp: ""
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "signup:errors.otpRequired"
        );
      });

      it("should reject OTP chứa chữ cái", () => {
        const result = verifyOtpSchema.validate({
          email: "test@example.com",
          otp: "12345a"
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "signup:errors.otpInvalid"
        );
      });

      it("should reject OTP chứa ký tự đặc biệt", () => {
        const result = verifyOtpSchema.validate({
          email: "test@example.com",
          otp: "123-45"
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "signup:errors.otpInvalid"
        );
      });

      it("should reject OTP có spaces", () => {
        const result = verifyOtpSchema.validate({
          email: "test@example.com",
          otp: "123 456"
        });

        expect(result.error).toBeDefined();
      });

      it("should reject khi thiếu OTP field", () => {
        const result = verifyOtpSchema.validate({
          email: "test@example.com"
        });

        expect(result.error).toBeDefined();
      });
    });
  });

  /*
   * ============================================================================
   * COMPLETE SIGNUP SCHEMA
   * ============================================================================
   */
  describe("completeSignupSchema", () => {
    const validBody = {
      email: "test@example.com",
      password: "password123",
      sessionId: "session-id-123",
      acceptTerms: true,
      fullName: "Test User",
      gender: "male",
      birthday: new Date("1990-01-01")
    };

    describe("Valid input", () => {
      it("should pass với tất cả fields hợp lệ", () => {
        const result = completeSignupSchema.validate(validBody);

        expect(result.error).toBeUndefined();
      });

      it("should pass với gender = female", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          gender: "female"
        });

        expect(result.error).toBeUndefined();
      });

      it("should pass với gender = other", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          gender: "other"
        });

        expect(result.error).toBeUndefined();
      });

      it("should pass với fullName có dấu (Vietnamese)", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: "Nguyễn Văn An"
        });

        expect(result.error).toBeUndefined();
      });

      it("should pass với fullName có hyphen", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: "Mary-Jane Watson"
        });

        expect(result.error).toBeUndefined();
      });

      it("should pass với fullName có apostrophe", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: "O'Connor"
        });

        expect(result.error).toBeUndefined();
      });
    });

    /*
     * --------------------------------------------------------
     * Email validation
     * --------------------------------------------------------
     */
    describe("Email validation", () => {
      it("should reject email rỗng", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          email: ""
        });

        expect(result.error).toBeDefined();
      });

      it("should reject email invalid", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          email: "not-an-email"
        });

        expect(result.error).toBeDefined();
      });
    });

    /*
     * --------------------------------------------------------
     * Password validation
     * --------------------------------------------------------
     */
    describe("Password validation", () => {
      it("should reject password quá ngắn (< 8 chars)", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          password: "1234567"
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "auth:validation.passwordMinLength"
        );
      });

      it("should pass với password đúng 8 chars", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          password: "12345678"
        });

        expect(result.error).toBeUndefined();
      });

      it("should reject password rỗng", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          password: ""
        });

        expect(result.error).toBeDefined();
      });
    });

    /*
     * --------------------------------------------------------
     * SessionId validation
     * --------------------------------------------------------
     */
    describe("SessionId validation", () => {
      it("should reject sessionId rỗng", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          sessionId: ""
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "signup:errors.sessionIdRequired"
        );
      });

      it("should reject khi thiếu sessionId", () => {
        const { sessionId: _sessionId, ...bodyWithoutSession } = validBody;
        const result = completeSignupSchema.validate(bodyWithoutSession);

        expect(result.error).toBeDefined();
      });
    });

    /*
     * --------------------------------------------------------
     * AcceptTerms validation
     * --------------------------------------------------------
     */
    describe("AcceptTerms validation", () => {
      it("should reject acceptTerms = false", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          acceptTerms: false
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "signup:errors.acceptTermsRequired"
        );
      });

      it("should reject acceptTerms không phải boolean", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          acceptTerms: "true"
        });

        expect(result.error).toBeDefined();
        // Joi validates strict boolean and "true" string fails as "not true"
        expect(result.error?.details[0].message).toMatch(
          /signup:errors\.acceptTerms(Invalid|Required)/
        );
      });

      it("should reject khi thiếu acceptTerms", () => {
        const { acceptTerms: _acceptTerms, ...bodyWithoutTerms } = validBody;
        const result = completeSignupSchema.validate(bodyWithoutTerms);

        expect(result.error).toBeDefined();
      });
    });

    /*
     * --------------------------------------------------------
     * FullName validation
     * --------------------------------------------------------
     */
    describe("FullName validation", () => {
      it("should reject fullName quá ngắn (< 2 chars)", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: "A"
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "user:validation.fullNameMinLength"
        );
      });

      it("should reject fullName quá dài (> 100 chars)", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: "A".repeat(101)
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "user:validation.fullNameMaxLength"
        );
      });

      it("should reject fullName chứa path traversal characters", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: "Test/User"
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "user:validation.fullNameInvalid"
        );
      });

      it("should reject fullName chứa backslash", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: "Test\\User"
        });

        expect(result.error).toBeDefined();
      });

      it("should reject fullName chứa số", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: "Test123"
        });

        expect(result.error).toBeDefined();
      });

      it("should reject fullName rỗng", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: ""
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "signup:errors.fullNameRequired"
        );
      });
    });

    /*
     * --------------------------------------------------------
     * Gender validation
     * --------------------------------------------------------
     */
    describe("Gender validation", () => {
      it("should reject gender không hợp lệ", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          gender: "unknown"
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "user:validation.genderInvalid"
        );
      });

      it("should reject gender rỗng", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          gender: ""
        });

        expect(result.error).toBeDefined();
        // Joi validates empty string against valid() first, so it returns genderInvalid
        expect(result.error?.details[0].message).toMatch(
          /(signup:errors\.genderRequired|user:validation\.genderInvalid)/
        );
      });

      it("should reject khi thiếu gender", () => {
        const { gender: _gender, ...bodyWithoutGender } = validBody;
        const result = completeSignupSchema.validate(bodyWithoutGender);

        expect(result.error).toBeDefined();
      });
    });

    /*
     * --------------------------------------------------------
     * Birthday validation
     * --------------------------------------------------------
     */
    describe("Birthday validation", () => {
      it("should reject birthday trong tương lai", () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const result = completeSignupSchema.validate({
          ...validBody,
          birthday: futureDate
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "user:validation.birthdayInvalid"
        );
      });

      it("should reject birthday quá xa (> 120 năm)", () => {
        const oldDate = new Date();
        oldDate.setFullYear(oldDate.getFullYear() - 121);

        const result = completeSignupSchema.validate({
          ...validBody,
          birthday: oldDate
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "user:validation.birthdayTooOld"
        );
      });

      it("should pass với birthday hợp lệ (18 tuổi)", () => {
        const validDate = new Date();
        validDate.setFullYear(validDate.getFullYear() - 18);

        const result = completeSignupSchema.validate({
          ...validBody,
          birthday: validDate
        });

        expect(result.error).toBeUndefined();
      });

      it("should pass với birthday là string ISO", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          birthday: "1990-06-15"
        });

        expect(result.error).toBeUndefined();
      });

      it("should reject birthday không hợp lệ", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          birthday: "not-a-date"
        });

        expect(result.error).toBeDefined();
      });

      it("should reject khi thiếu birthday", () => {
        const { birthday: _birthday, ...bodyWithoutBirthday } = validBody;
        const result = completeSignupSchema.validate(bodyWithoutBirthday);

        expect(result.error).toBeDefined();
      });
    });

    /*
     * --------------------------------------------------------
     * Edge cases
     * --------------------------------------------------------
     */
    describe("Edge cases", () => {
      it("should reject unknown fields", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          unknownField: "value"
        });

        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toContain("unknownField");
      });

      it("should validate all fields with abortEarly: false", () => {
        const result = completeSignupSchema.validate(
          {
            email: "",
            password: "",
            sessionId: "",
            acceptTerms: false,
            fullName: "",
            gender: "",
            birthday: "invalid"
          },
          { abortEarly: false }
        );

        expect(result.error).toBeDefined();
        expect(result.error?.details.length).toBeGreaterThan(1);
      });

      it("should handle Vietnamese names with special Unicode", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: "Trần Thị Hồng Nhung"
        });

        expect(result.error).toBeUndefined();
      });

      it("should handle Korean names", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: "김철수"
        });

        expect(result.error).toBeUndefined();
      });

      it("should handle Japanese names", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: "田中太郎"
        });

        expect(result.error).toBeUndefined();
      });

      it("should handle Chinese names", () => {
        const result = completeSignupSchema.validate({
          ...validBody,
          fullName: "李明"
        });

        expect(result.error).toBeUndefined();
      });
    });
  });
});
