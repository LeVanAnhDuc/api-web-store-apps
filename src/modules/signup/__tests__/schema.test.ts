/**
 * Unit tests for Signup Validation Schemas
 *
 * Test Categories:
 * 1. sendOtpSchema - Email validation
 * 2. verifyOtpSchema - Email + OTP validation
 * 3. completeSignupSchema - Full form validation
 * 4. Edge Cases - Boundary values, special characters
 */

import {
  sendOtpSchema,
  resendOtpSchema,
  verifyOtpSchema,
  completeSignupSchema,
  checkEmailSchema
} from "../schema";

describe("Signup Validation Schemas", () => {
  // sendOtpSchema Tests
  describe("sendOtpSchema", () => {
    describe("Happy Cases", () => {
      it("should accept valid email", () => {
        const result = sendOtpSchema.validate({ email: "test@example.com" });
        expect(result.error).toBeUndefined();
      });

      it("should accept email with subdomain", () => {
        const result = sendOtpSchema.validate({
          email: "user@mail.example.com"
        });
        expect(result.error).toBeUndefined();
      });

      it("should accept email with plus sign", () => {
        const result = sendOtpSchema.validate({
          email: "user+tag@example.com"
        });
        expect(result.error).toBeUndefined();
      });

      it("should accept email with dots in local part", () => {
        const result = sendOtpSchema.validate({
          email: "first.last@example.com"
        });
        expect(result.error).toBeUndefined();
      });
    });

    describe("Failure Cases", () => {
      it("should reject empty email", () => {
        const result = sendOtpSchema.validate({ email: "" });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "auth:validation.emailRequired"
        );
      });

      it("should reject missing email", () => {
        const result = sendOtpSchema.validate({});
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "auth:validation.emailRequired"
        );
      });

      it("should reject invalid email format", () => {
        const invalidEmails = [
          "invalid",
          "no@domain",
          "@nodomain.com",
          "spaces in@email.com",
          "double@@at.com"
        ];

        for (const email of invalidEmails) {
          const result = sendOtpSchema.validate({ email });
          expect(result.error).toBeDefined();
        }
      });

      it("should reject email that is too short", () => {
        const result = sendOtpSchema.validate({ email: "a@b" }); // Less than min length
        expect(result.error).toBeDefined();
      });

      it("should reject email that is too long", () => {
        const longEmail = "a".repeat(250) + "@test.com";
        const result = sendOtpSchema.validate({ email: longEmail });
        expect(result.error).toBeDefined();
      });
    });
  });

  // resendOtpSchema Tests
  describe("resendOtpSchema", () => {
    it("should have same validation as sendOtpSchema", () => {
      const validEmail = { email: "test@example.com" };
      const invalidEmail = { email: "" };

      expect(resendOtpSchema.validate(validEmail).error).toBeUndefined();
      expect(resendOtpSchema.validate(invalidEmail).error).toBeDefined();
    });
  });

  // verifyOtpSchema Tests
  describe("verifyOtpSchema", () => {
    describe("Happy Cases", () => {
      it("should accept valid email and OTP", () => {
        const result = verifyOtpSchema.validate({
          email: "test@example.com",
          otp: "123456"
        });
        expect(result.error).toBeUndefined();
      });

      it("should accept OTP with leading zeros", () => {
        const result = verifyOtpSchema.validate({
          email: "test@example.com",
          otp: "012345"
        });
        expect(result.error).toBeUndefined();
      });
    });

    describe("Failure Cases - OTP", () => {
      it("should reject empty OTP", () => {
        const result = verifyOtpSchema.validate({
          email: "test@example.com",
          otp: ""
        });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "auth:validation.otpRequired"
        );
      });

      it("should reject missing OTP", () => {
        const result = verifyOtpSchema.validate({
          email: "test@example.com"
        });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "auth:validation.otpRequired"
        );
      });

      it("should reject OTP with non-numeric characters", () => {
        const invalidOtps = ["12345a", "abcdef", "12-345", "12 345"];

        for (const otp of invalidOtps) {
          const result = verifyOtpSchema.validate({
            email: "test@example.com",
            otp
          });
          expect(result.error).toBeDefined();
          expect(result.error?.details[0].message).toBe(
            "auth:validation.otpDigitsOnly"
          );
        }
      });

      it("should reject OTP with incorrect length", () => {
        const invalidLengthOtps = ["12345", "1234567", "1234"];

        for (const otp of invalidLengthOtps) {
          const result = verifyOtpSchema.validate({
            email: "test@example.com",
            otp
          });
          expect(result.error).toBeDefined();
          expect(result.error?.details[0].message).toBe(
            "auth:validation.otpLength"
          );
        }
      });
    });

    describe("Failure Cases - Email", () => {
      it("should reject invalid email with valid OTP", () => {
        const result = verifyOtpSchema.validate({
          email: "invalid-email",
          otp: "123456"
        });
        expect(result.error).toBeDefined();
      });
    });
  });

  // completeSignupSchema Tests
  describe("completeSignupSchema", () => {
    const validData = {
      email: "test@example.com",
      password: "SecureP@ss123",
      confirmPassword: "SecureP@ss123",
      sessionToken: "a".repeat(64), // 32 bytes * 2 (hex)
      acceptTerms: true,
      fullName: "John Doe",
      gender: "male",
      dateOfBirth: new Date("1990-01-01")
    };

    describe("Happy Cases", () => {
      it("should accept all valid fields", () => {
        const result = completeSignupSchema.validate(validData);
        expect(result.error).toBeUndefined();
      });

      it("should accept different gender values", () => {
        const genders = ["male", "female", "other"];

        for (const gender of genders) {
          const result = completeSignupSchema.validate({
            ...validData,
            gender
          });
          expect(result.error).toBeUndefined();
        }
      });

      it("should accept full name with special characters", () => {
        const validNames = [
          "Jean-Pierre",
          "O'Connor",
          "María José",
          "Nguyễn Văn"
        ];

        for (const fullName of validNames) {
          const result = completeSignupSchema.validate({
            ...validData,
            fullName
          });
          expect(result.error).toBeUndefined();
        }
      });

      it("should accept date string for dateOfBirth", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          dateOfBirth: "1990-01-01"
        });
        expect(result.error).toBeUndefined();
      });
    });

    describe("Failure Cases - Password", () => {
      it("should reject empty password", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          password: "",
          confirmPassword: ""
        });
        expect(result.error).toBeDefined();
      });

      it("should reject password shorter than minimum length", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          password: "short",
          confirmPassword: "short"
        });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "auth:validation.passwordMinLength"
        );
      });

      it("should reject password mismatch", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          password: "SecureP@ss123",
          confirmPassword: "DifferentPass123"
        });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "signup:errors.passwordMismatch"
        );
      });
    });

    describe("Failure Cases - Session Token", () => {
      it("should reject empty session token", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          sessionToken: ""
        });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "signup:errors.sessionTokenRequired"
        );
      });

      it("should reject session token with wrong length", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          sessionToken: "short"
        });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "signup:errors.sessionTokenInvalid"
        );
      });
    });

    describe("Failure Cases - Accept Terms", () => {
      it("should reject false acceptTerms", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          acceptTerms: false
        });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "signup:errors.acceptTermsRequired"
        );
      });

      it("should reject non-boolean acceptTerms", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          acceptTerms: "true" // String, not boolean
        });
        expect(result.error).toBeDefined();
      });

      it("should reject missing acceptTerms", () => {
        const { acceptTerms: _acceptTerms, ...dataWithoutTerms } = validData;
        const result = completeSignupSchema.validate(dataWithoutTerms);
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "signup:errors.acceptTermsRequired"
        );
      });
    });

    describe("Failure Cases - Full Name", () => {
      it("should reject empty full name", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          fullName: ""
        });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "signup:errors.fullNameRequired"
        );
      });

      it("should reject full name with numbers", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          fullName: "John123"
        });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "user:validation.fullNameInvalid"
        );
      });

      it("should reject full name with special characters (invalid)", () => {
        const invalidNames = ["John@Doe", "John<script>", "John#123"];

        for (const fullName of invalidNames) {
          const result = completeSignupSchema.validate({
            ...validData,
            fullName
          });
          expect(result.error).toBeDefined();
        }
      });

      it("should reject full name that is too short", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          fullName: "A" // Assuming min length is > 1
        });
        expect(result.error).toBeDefined();
      });

      it("should reject full name that is too long", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          fullName: "A".repeat(200) // Assuming max length is < 200
        });
        expect(result.error).toBeDefined();
      });
    });

    describe("Failure Cases - Gender", () => {
      it("should reject empty gender", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          gender: ""
        });
        expect(result.error).toBeDefined();
        // Empty string triggers "any.only" because "" is not in valid values
        expect(result.error?.details[0].message).toBe(
          "user:validation.genderInvalid"
        );
      });

      it("should reject invalid gender value", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          gender: "invalid"
        });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "user:validation.genderInvalid"
        );
      });
    });

    describe("Failure Cases - Date of Birth", () => {
      it("should reject missing date of birth", () => {
        const { dateOfBirth: _dateOfBirth, ...dataWithoutDob } = validData;
        const result = completeSignupSchema.validate(dataWithoutDob);
        expect(result.error).toBeDefined();
      });

      it("should reject invalid date format", () => {
        const result = completeSignupSchema.validate({
          ...validData,
          dateOfBirth: "invalid-date"
        });
        expect(result.error).toBeDefined();
      });

      it("should reject date of birth that makes user too young", () => {
        const today = new Date();
        const tooYoung = new Date(today);
        tooYoung.setFullYear(tooYoung.getFullYear() - 10); // 10 years old

        const result = completeSignupSchema.validate({
          ...validData,
          dateOfBirth: tooYoung
        });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "user:validation.dateOfBirthTooYoung"
        );
      });

      it("should reject date of birth that makes user too old", () => {
        const tooOld = new Date("1900-01-01");

        const result = completeSignupSchema.validate({
          ...validData,
          dateOfBirth: tooOld
        });
        expect(result.error).toBeDefined();
        expect(result.error?.details[0].message).toBe(
          "user:validation.dateOfBirthTooOld"
        );
      });
    });
  });

  // checkEmailSchema Tests
  describe("checkEmailSchema", () => {
    it("should accept valid email", () => {
      const result = checkEmailSchema.validate({ email: "test@example.com" });
      expect(result.error).toBeUndefined();
    });

    it("should reject invalid email", () => {
      const result = checkEmailSchema.validate({ email: "invalid" });
      expect(result.error).toBeDefined();
    });
  });

  // Security Tests
  describe("Security - XSS Prevention", () => {
    it("should reject email with script tags", () => {
      const result = sendOtpSchema.validate({
        email: "<script>alert('xss')</script>@example.com"
      });
      expect(result.error).toBeDefined();
    });

    it("should reject full name with HTML", () => {
      const result = completeSignupSchema.validate({
        email: "test@example.com",
        password: "SecureP@ss123",
        confirmPassword: "SecureP@ss123",
        sessionToken: "a".repeat(64),
        acceptTerms: true,
        fullName: "<b>Bold Name</b>",
        gender: "male",
        dateOfBirth: "1990-01-01"
      });
      expect(result.error).toBeDefined();
    });
  });

  describe("Security - Unicode Attacks", () => {
    it("should reject email with zero-width characters", () => {
      const result = sendOtpSchema.validate({
        email: "test\u200B@example.com" // Zero-width space
      });
      expect(result.error).toBeDefined();
    });

    it("should reject email with RTL override characters", () => {
      const result = sendOtpSchema.validate({
        email: "test\u202E@example.com" // RTL override
      });
      expect(result.error).toBeDefined();
    });
  });
});
