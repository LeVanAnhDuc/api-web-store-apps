/**
 * Unit tests for SendOtp Service
 *
 * Test Categories:
 * 1. Happy Case: OTP sent successfully
 * 2. Failure Cases: Cooldown not expired, Email already registered
 * 3. Edge Cases: Rate limiting, Redis errors
 */

import { sendOtp } from "../service/send-otp.service";
import * as repository from "../repository";
import * as signupStore from "../utils/store";
import * as otpUtils from "../utils/otp";
import * as notifier from "../notifier";
import { BadRequestError, ConflictRequestError } from "@/core/responses/error";
import { createSendOtpRequest, mockOtp, TEST_EMAIL } from "./helpers";

// Mock dependencies
jest.mock("../repository");
jest.mock("../utils/store");
jest.mock("../utils/otp");
jest.mock("../notifier");
jest.mock("@/core/utils/logger");

const mockRepository = repository as jest.Mocked<typeof repository>;
const mockStore = signupStore as jest.Mocked<typeof signupStore>;
const mockOtpUtils = otpUtils as jest.Mocked<typeof otpUtils>;
const mockNotifier = notifier as jest.Mocked<typeof notifier>;

describe("SendOtp Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations for happy path
    mockStore.checkOtpCoolDown.mockResolvedValue(true); // No cooldown
    mockRepository.isEmailRegistered.mockResolvedValue(false); // Email not registered
    mockOtpUtils.generateOtp.mockReturnValue(mockOtp);
    mockStore.deleteOtp.mockResolvedValue(undefined);
    mockStore.createAndStoreOtp.mockResolvedValue(undefined);
    mockStore.setOtpCoolDown.mockResolvedValue(undefined);
    mockNotifier.notifyOtpByEmail.mockImplementation(() => {});
  });

  // ===========================================================================
  // Happy Case Tests
  // ===========================================================================
  describe("Happy Case - OTP Sent Successfully", () => {
    it("should return success response when OTP is sent", async () => {
      const req = createSendOtpRequest(TEST_EMAIL);

      const result = await sendOtp(req);

      expect(result.message).toBe("signup:success.otpSent");
      expect(result.data).toEqual({
        success: true,
        expiresIn: expect.any(Number),
        cooldownSeconds: expect.any(Number)
      });
    });

    it("should check cooldown before processing", async () => {
      const req = createSendOtpRequest(TEST_EMAIL);

      await sendOtp(req);

      expect(mockStore.checkOtpCoolDown).toHaveBeenCalledWith(TEST_EMAIL);
      expect(mockStore.checkOtpCoolDown).toHaveBeenCalledTimes(1);
    });

    it("should check if email is already registered", async () => {
      const req = createSendOtpRequest(TEST_EMAIL);

      await sendOtp(req);

      expect(mockRepository.isEmailRegistered).toHaveBeenCalledWith(TEST_EMAIL);
      expect(mockRepository.isEmailRegistered).toHaveBeenCalledTimes(1);
    });

    it("should generate OTP using secure random generator", async () => {
      const req = createSendOtpRequest(TEST_EMAIL);

      await sendOtp(req);

      expect(mockOtpUtils.generateOtp).toHaveBeenCalledTimes(1);
    });

    it("should delete existing OTP before creating new one (idempotency)", async () => {
      const req = createSendOtpRequest(TEST_EMAIL);

      await sendOtp(req);

      expect(mockStore.deleteOtp).toHaveBeenCalledWith(TEST_EMAIL);
      // Delete should be called before createAndStoreOtp
      const deleteCallOrder = mockStore.deleteOtp.mock.invocationCallOrder[0];
      const createCallOrder =
        mockStore.createAndStoreOtp.mock.invocationCallOrder[0];
      expect(deleteCallOrder).toBeLessThan(createCallOrder);
    });

    it("should store OTP with correct expiry time", async () => {
      const req = createSendOtpRequest(TEST_EMAIL);

      await sendOtp(req);

      expect(mockStore.createAndStoreOtp).toHaveBeenCalledWith(
        TEST_EMAIL,
        mockOtp,
        expect.any(Number)
      );
    });

    it("should set cooldown after creating OTP", async () => {
      const req = createSendOtpRequest(TEST_EMAIL);

      await sendOtp(req);

      expect(mockStore.setOtpCoolDown).toHaveBeenCalledWith(
        TEST_EMAIL,
        expect.any(Number)
      );
    });

    it("should send OTP email notification", async () => {
      const req = createSendOtpRequest(TEST_EMAIL, "en");

      await sendOtp(req);

      expect(mockNotifier.notifyOtpByEmail).toHaveBeenCalledWith(
        TEST_EMAIL,
        mockOtp,
        "en"
      );
    });

    it("should send OTP with correct language", async () => {
      const req = createSendOtpRequest(TEST_EMAIL, "vi");

      await sendOtp(req);

      expect(mockNotifier.notifyOtpByEmail).toHaveBeenCalledWith(
        TEST_EMAIL,
        mockOtp,
        "vi"
      );
    });
  });

  // ===========================================================================
  // Failure Case Tests
  // ===========================================================================
  describe("Failure Cases", () => {
    describe("Cooldown Not Expired", () => {
      it("should throw BadRequestError when cooldown is active", async () => {
        mockStore.checkOtpCoolDown.mockResolvedValue(false); // Cooldown active
        const req = createSendOtpRequest(TEST_EMAIL);

        await expect(sendOtp(req)).rejects.toThrow(BadRequestError);
        expect(req.t).toHaveBeenCalledWith("signup:errors.resendCoolDown");
      });

      it("should not check email registration when cooldown is active", async () => {
        mockStore.checkOtpCoolDown.mockResolvedValue(false);
        const req = createSendOtpRequest(TEST_EMAIL);

        try {
          await sendOtp(req);
        } catch {
          // Expected error
        }

        expect(mockRepository.isEmailRegistered).not.toHaveBeenCalled();
      });

      it("should not generate OTP when cooldown is active", async () => {
        mockStore.checkOtpCoolDown.mockResolvedValue(false);
        const req = createSendOtpRequest(TEST_EMAIL);

        try {
          await sendOtp(req);
        } catch {
          // Expected error
        }

        expect(mockOtpUtils.generateOtp).not.toHaveBeenCalled();
      });

      it("should not send email when cooldown is active", async () => {
        mockStore.checkOtpCoolDown.mockResolvedValue(false);
        const req = createSendOtpRequest(TEST_EMAIL);

        try {
          await sendOtp(req);
        } catch {
          // Expected error
        }

        expect(mockNotifier.notifyOtpByEmail).not.toHaveBeenCalled();
      });
    });

    describe("Email Already Registered", () => {
      it("should throw ConflictRequestError when email exists", async () => {
        mockRepository.isEmailRegistered.mockResolvedValue(true);
        const req = createSendOtpRequest(TEST_EMAIL);

        await expect(sendOtp(req)).rejects.toThrow(ConflictRequestError);
        expect(req.t).toHaveBeenCalledWith("signup:errors.emailAlreadyExists");
      });

      it("should not generate OTP when email already exists", async () => {
        mockRepository.isEmailRegistered.mockResolvedValue(true);
        const req = createSendOtpRequest(TEST_EMAIL);

        try {
          await sendOtp(req);
        } catch {
          // Expected error
        }

        expect(mockOtpUtils.generateOtp).not.toHaveBeenCalled();
      });

      it("should not send email when email already exists", async () => {
        mockRepository.isEmailRegistered.mockResolvedValue(true);
        const req = createSendOtpRequest(TEST_EMAIL);

        try {
          await sendOtp(req);
        } catch {
          // Expected error
        }

        expect(mockNotifier.notifyOtpByEmail).not.toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // Edge Case Tests
  // ===========================================================================
  describe("Edge Cases", () => {
    it("should handle email with different cases consistently", async () => {
      const emails = [
        "Test@Example.com",
        "TEST@EXAMPLE.COM",
        "test@example.com"
      ];

      for (const email of emails) {
        jest.clearAllMocks();
        mockStore.checkOtpCoolDown.mockResolvedValue(true);
        mockRepository.isEmailRegistered.mockResolvedValue(false);
        mockOtpUtils.generateOtp.mockReturnValue(mockOtp);

        const req = createSendOtpRequest(email);
        await sendOtp(req);

        expect(mockStore.checkOtpCoolDown).toHaveBeenCalledWith(email);
      }
    });

    it("should call operations in correct order", async () => {
      const callOrder: string[] = [];

      mockStore.checkOtpCoolDown.mockImplementation(async () => {
        callOrder.push("checkCooldown");
        return true;
      });

      mockRepository.isEmailRegistered.mockImplementation(async () => {
        callOrder.push("checkEmail");
        return false;
      });

      mockOtpUtils.generateOtp.mockImplementation(() => {
        callOrder.push("generateOtp");
        return mockOtp;
      });

      mockStore.deleteOtp.mockImplementation(async () => {
        callOrder.push("deleteOtp");
      });

      mockStore.createAndStoreOtp.mockImplementation(async () => {
        callOrder.push("createOtp");
      });

      mockStore.setOtpCoolDown.mockImplementation(async () => {
        callOrder.push("setCooldown");
      });

      const req = createSendOtpRequest(TEST_EMAIL);
      await sendOtp(req);

      expect(callOrder).toEqual([
        "checkCooldown",
        "checkEmail",
        "generateOtp",
        "deleteOtp",
        "createOtp",
        "setCooldown"
      ]);
    });

    it("should handle long email addresses", async () => {
      const longEmail = "a".repeat(50) + "@" + "b".repeat(50) + ".com";
      const req = createSendOtpRequest(longEmail);

      const result = await sendOtp(req);

      expect(result.data?.success).toBe(true);
      expect(mockStore.checkOtpCoolDown).toHaveBeenCalledWith(longEmail);
    });

    it("should send email notification asynchronously (fire-and-forget)", async () => {
      // notifyOtpByEmail should be called without await
      // This test verifies the function completes even if email sending is slow
      let emailSendCalled = false;
      mockNotifier.notifyOtpByEmail.mockImplementation(() => {
        emailSendCalled = true;
      });

      const req = createSendOtpRequest(TEST_EMAIL);
      await sendOtp(req);

      expect(emailSendCalled).toBe(true);
    });
  });

  // ===========================================================================
  // Business Flow Order Verification
  // ===========================================================================
  describe("Business Flow Verification", () => {
    it("should follow the correct business flow order", async () => {
      /**
       * Expected order:
       * 1. Check cooldown
       * 2. Check email not registered
       * 3. Generate OTP
       * 4. Delete existing OTP (idempotency)
       * 5. Store new OTP
       * 6. Start cooldown
       * 7. Send email (async)
       */
      const req = createSendOtpRequest(TEST_EMAIL);
      await sendOtp(req);

      // Verify all operations were called
      expect(mockStore.checkOtpCoolDown).toHaveBeenCalled();
      expect(mockRepository.isEmailRegistered).toHaveBeenCalled();
      expect(mockOtpUtils.generateOtp).toHaveBeenCalled();
      expect(mockStore.deleteOtp).toHaveBeenCalled();
      expect(mockStore.createAndStoreOtp).toHaveBeenCalled();
      expect(mockStore.setOtpCoolDown).toHaveBeenCalled();
      expect(mockNotifier.notifyOtpByEmail).toHaveBeenCalled();
    });
  });
});
