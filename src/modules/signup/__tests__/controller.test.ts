/**
 * Unit tests for Signup Controllers
 *
 * Test scenarios covered:
 * 1. sendOtpController - Send OTP endpoint
 * 2. verifyOtpController - Verify OTP endpoint
 * 3. completeSignupController - Complete signup endpoint
 * 4. Error propagation via asyncHandler
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import {
  sendOtpController,
  verifyOtpController,
  completeSignupController
} from "../controller";
import * as signupService from "../service";
import { OkSuccess } from "@/core/responses/success";

// Mock dependencies
jest.mock("../service");
jest.mock("@/core/responses/success");

const mockSignupService = signupService as jest.Mocked<typeof signupService>;

describe("Signup Controllers", () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let mockSend: jest.Mock;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockSend = jest.fn();
    mockNext = jest.fn();

    mockRequest = {
      body: {},
      t: jest.fn((key: string) => key),
      language: "en"
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    (OkSuccess as jest.Mock).mockImplementation(() => ({
      send: mockSend
    }));
  });

  /*
   * ============================================================================
   * SEND OTP CONTROLLER
   * ============================================================================
   */
  describe("sendOtpController", () => {
    describe("Successful request", () => {
      it("should send OTP và return success response", async () => {
        const serviceResult = {
          message: "OTP sent successfully",
          data: {
            success: true as const,
            expiresIn: 300,
            cooldownSeconds: 60
          }
        };
        mockSignupService.sendOtp.mockResolvedValue(serviceResult);
        mockRequest.body = { email: "test@example.com" };

        sendOtpController(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        await new Promise((resolve) => setImmediate(resolve));

        expect(mockSignupService.sendOtp).toHaveBeenCalledWith(mockRequest);
        expect(OkSuccess).toHaveBeenCalledWith({
          data: serviceResult.data,
          message: "OTP sent successfully"
        });
        expect(mockSend).toHaveBeenCalledWith(mockRequest, mockResponse);
      });
    });

    describe("Error handling", () => {
      it("should pass error to next middleware", async () => {
        const error = new Error("Service error");
        mockSignupService.sendOtp.mockRejectedValue(error);

        sendOtpController(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        await new Promise((resolve) => setImmediate(resolve));

        expect(mockNext).toHaveBeenCalledWith(error);
        expect(mockSend).not.toHaveBeenCalled();
      });

      it("should not send response when error occurs", async () => {
        mockSignupService.sendOtp.mockRejectedValue(new Error("Error"));

        sendOtpController(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        await new Promise((resolve) => setImmediate(resolve));

        expect(OkSuccess).not.toHaveBeenCalled();
      });
    });
  });

  /*
   * ============================================================================
   * VERIFY OTP CONTROLLER
   * ============================================================================
   */
  describe("verifyOtpController", () => {
    describe("Successful request", () => {
      it("should verify OTP và return success response với sessionToken", async () => {
        const serviceResult = {
          message: "OTP verified",
          data: {
            success: true as const,
            sessionToken: "session-token-123",
            expiresIn: 300
          }
        };
        mockSignupService.verifyOtp.mockResolvedValue(serviceResult);
        mockRequest.body = { email: "test@example.com", otp: "123456" };

        verifyOtpController(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        await new Promise((resolve) => setImmediate(resolve));

        expect(mockSignupService.verifyOtp).toHaveBeenCalledWith(mockRequest);
        expect(OkSuccess).toHaveBeenCalledWith({
          data: serviceResult.data,
          message: "OTP verified"
        });
        expect(mockSend).toHaveBeenCalled();
      });
    });

    describe("Error handling", () => {
      it("should pass BadRequestError to next when OTP invalid", async () => {
        const error = new Error("Invalid OTP");
        error.name = "BadRequestError";
        mockSignupService.verifyOtp.mockRejectedValue(error);
        mockRequest.body = { email: "test@example.com", otp: "wrong" };

        verifyOtpController(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        await new Promise((resolve) => setImmediate(resolve));

        expect(mockNext).toHaveBeenCalledWith(error);
      });

      it("should pass account locked error to next", async () => {
        const error = new Error("Account locked");
        mockSignupService.verifyOtp.mockRejectedValue(error);

        verifyOtpController(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        await new Promise((resolve) => setImmediate(resolve));

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });
  });

  /*
   * ============================================================================
   * COMPLETE SIGNUP CONTROLLER
   * ============================================================================
   */
  describe("completeSignupController", () => {
    describe("Successful request", () => {
      it("should complete signup và return user and tokens", async () => {
        const serviceResult = {
          message: "Signup completed",
          data: {
            success: true as const,
            user: {
              id: "user-id-123",
              email: "test@example.com",
              fullName: "Test User"
            },
            tokens: {
              accessToken: "access-token",
              refreshToken: "refresh-token",
              expiresIn: 3600
            }
          }
        };
        mockSignupService.completeSignup.mockResolvedValue(serviceResult);
        mockRequest.body = {
          email: "test@example.com",
          password: "password123",
          fullName: "Test User",
          gender: "male",
          dateOfBirth: "1990-01-01",
          sessionToken: "session-token-123"
        };

        completeSignupController(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        await new Promise((resolve) => setImmediate(resolve));

        expect(mockSignupService.completeSignup).toHaveBeenCalledWith(
          mockRequest
        );
        expect(OkSuccess).toHaveBeenCalledWith({
          data: serviceResult.data,
          message: "Signup completed"
        });
        expect(mockSend).toHaveBeenCalled();
      });
    });

    describe("Error handling", () => {
      it("should pass invalid session error to next", async () => {
        const error = new Error("Invalid session");
        error.name = "BadRequestError";
        mockSignupService.completeSignup.mockRejectedValue(error);

        completeSignupController(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        await new Promise((resolve) => setImmediate(resolve));

        expect(mockNext).toHaveBeenCalledWith(error);
      });

      it("should pass email exists error to next", async () => {
        const error = new Error("Email already exists");
        error.name = "ConflictRequestError";
        mockSignupService.completeSignup.mockRejectedValue(error);

        completeSignupController(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        await new Promise((resolve) => setImmediate(resolve));

        expect(mockNext).toHaveBeenCalledWith(error);
      });

      it("should not send success response when error occurs", async () => {
        mockSignupService.completeSignup.mockRejectedValue(new Error("Error"));

        completeSignupController(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        await new Promise((resolve) => setImmediate(resolve));

        expect(mockSend).not.toHaveBeenCalled();
      });
    });
  });

  /*
   * ============================================================================
   * INPUT HANDLING
   * ============================================================================
   */
  describe("Input handling", () => {
    it("should pass request to sendOtp service", async () => {
      const serviceResult = {
        message: "Success",
        data: { success: true as const, expiresIn: 300, cooldownSeconds: 60 }
      };
      mockSignupService.sendOtp.mockResolvedValue(serviceResult);

      const customRequest = {
        body: { email: "custom@example.com" },
        t: jest.fn(),
        language: "vi"
      };

      sendOtpController(
        customRequest as any,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockSignupService.sendOtp).toHaveBeenCalledWith(customRequest);
    });

    it("should pass request to verifyOtp service", async () => {
      const serviceResult = {
        message: "Success",
        data: { success: true as const, sessionToken: "st", expiresIn: 300 }
      };
      mockSignupService.verifyOtp.mockResolvedValue(serviceResult);

      const customRequest = {
        body: { email: "test@example.com", otp: "654321" },
        t: jest.fn(),
        language: "en"
      };

      verifyOtpController(
        customRequest as any,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockSignupService.verifyOtp).toHaveBeenCalledWith(customRequest);
    });

    it("should pass request to completeSignup service", async () => {
      const serviceResult = {
        message: "Success",
        data: {
          success: true as const,
          user: {
            id: "uid",
            email: "test@example.com",
            fullName: "Name"
          },
          tokens: {
            accessToken: "at",
            refreshToken: "rt",
            expiresIn: 3600
          }
        }
      };
      mockSignupService.completeSignup.mockResolvedValue(serviceResult);

      const customRequest = {
        body: {
          email: "test@example.com",
          password: "pass",
          fullName: "Name",
          gender: "female",
          dateOfBirth: "2000-01-01",
          sessionToken: "st"
        },
        t: jest.fn(),
        language: "vi"
      };

      completeSignupController(
        customRequest as any,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockSignupService.completeSignup).toHaveBeenCalledWith(
        customRequest
      );
    });
  });
});
