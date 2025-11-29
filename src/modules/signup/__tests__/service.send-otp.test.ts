/**
 * Unit tests for Signup Service - Send OTP
 */

import { sendOtp } from "../service";
import AuthModel from "@/modules/auth/model";
import * as signupStore from "../utils/store";
import * as otpUtils from "../utils/otp";
import * as emailService from "@/shared/services/email/email.service";
import { BadRequestError, ConflictRequestError } from "@/core/responses/error";
import { createMockRequest } from "./helpers";

// Mock dependencies
jest.mock("@/modules/auth/model");
jest.mock("../utils/store");
jest.mock("../utils/otp");
jest.mock("@/shared/services/email/email.service");

const mockAuthModel = AuthModel as jest.Mocked<typeof AuthModel>;
const mockStore = signupStore as jest.Mocked<typeof signupStore>;
const mockOtpUtils = otpUtils as jest.Mocked<typeof otpUtils>;
const mockEmailService = emailService as jest.Mocked<typeof emailService>;

describe("Signup Service - Send OTP", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockStore.checkOtpCoolDown.mockResolvedValue(true);
    mockStore.setOtpCoolDown.mockResolvedValue(undefined);
    mockStore.createAndStoreOtp.mockResolvedValue(undefined);
    mockStore.deleteOtp.mockResolvedValue(undefined);

    mockOtpUtils.generateOtp.mockReturnValue("123456");
    mockEmailService.sendTemplatedEmail.mockResolvedValue(undefined);
    mockAuthModel.findOne = jest.fn().mockResolvedValue(null);
  });

  describe("Successful OTP sending", () => {
    it("should return success response khi gửi OTP thành công", async () => {
      const req = createMockRequest({ email: "test@example.com" });

      const result = await sendOtp(req);

      expect(result.message).toBe("signup:success.otpSent");
      expect(result.data).toEqual({
        success: true,
        expiresIn: 600
      });
    });

    it("should generate và store OTP", async () => {
      const req = createMockRequest({ email: "test@example.com" });

      await sendOtp(req);

      expect(mockOtpUtils.generateOtp).toHaveBeenCalled();
      expect(mockStore.deleteOtp).toHaveBeenCalledWith("test@example.com");
      expect(mockStore.createAndStoreOtp).toHaveBeenCalledWith(
        "test@example.com",
        "123456",
        600
      );
    });

    it("should set OTP cooldown", async () => {
      const req = createMockRequest({ email: "test@example.com" });

      await sendOtp(req);

      expect(mockStore.checkOtpCoolDown).toHaveBeenCalledWith(
        "test@example.com"
      );
      expect(mockStore.setOtpCoolDown).toHaveBeenCalledWith(
        "test@example.com",
        60
      );
    });

    it("should check email availability", async () => {
      const req = createMockRequest({ email: "test@example.com" });

      await sendOtp(req);

      expect(mockAuthModel.findOne).toHaveBeenCalledWith({
        email: "test@example.com"
      });
    });

    it("should return success immediately (email sent in background)", async () => {
      const req = createMockRequest({ email: "test@example.com" }, "vi");

      const result = await sendOtp(req);

      expect(result.data?.success).toBe(true);
      expect(result.message).toBe("signup:success.otpSent");
    });
  });

  describe("Error handling", () => {
    it("should throw BadRequestError khi đang trong cooldown", async () => {
      mockStore.checkOtpCoolDown.mockResolvedValue(false);
      const req = createMockRequest({ email: "test@example.com" });

      await expect(sendOtp(req)).rejects.toThrow(BadRequestError);
      expect(req.t).toHaveBeenCalledWith("signup:errors.resendCoolDown");
    });

    it("should throw ConflictRequestError khi email đã tồn tại", async () => {
      mockAuthModel.findOne = jest.fn().mockResolvedValue({
        email: "test@example.com"
      });
      const req = createMockRequest({ email: "test@example.com" });

      await expect(sendOtp(req)).rejects.toThrow(ConflictRequestError);
      expect(req.t).toHaveBeenCalledWith("signup:errors.emailAlreadyExists");
    });

    it("should không block khi email sending fails", async () => {
      mockEmailService.sendTemplatedEmail.mockRejectedValue(
        new Error("SMTP error")
      );
      const req = createMockRequest({ email: "test@example.com" });

      const result = await sendOtp(req);

      expect(result.data?.success).toBe(true);
    });
  });
});
