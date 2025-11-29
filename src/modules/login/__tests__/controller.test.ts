/**
 * Unit tests for Login Controller
 *
 * Test scenarios covered:
 * 1. Successful login - Set refresh token cookie and send response
 * 2. Successful login - Without refresh token (edge case)
 * 3. Response data structure
 * 4. Error propagation from service
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import { loginController } from "../controller";
import * as loginService from "../service";
import { OkSuccess } from "@/core/responses/success";

// Mock dependencies
jest.mock("../service");
jest.mock("@/core/responses/success");
jest.mock("@/core/configs/cookie", () => ({
  COOKIE_NAMES: {
    REFRESH_TOKEN: "refreshToken"
  },
  REFRESH_TOKEN_COOKIE_OPTIONS: {
    httpOnly: true,
    secure: true,
    sameSite: "strict"
  }
}));

const mockLoginService = loginService as jest.Mocked<typeof loginService>;

describe("Login Controller", () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let mockSend: jest.Mock;
  let mockCookie: jest.Mock;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockSend = jest.fn();
    mockCookie = jest.fn();
    mockNext = jest.fn();

    mockRequest = {
      body: {
        email: "test@example.com",
        password: "password123"
      },
      t: jest.fn((key: string) => key),
      language: "en"
    };

    mockResponse = {
      cookie: mockCookie,
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    (OkSuccess as jest.Mock).mockImplementation(() => ({
      send: mockSend
    }));
  });

  /*
   * ============================================================================
   * SUCCESSFUL LOGIN - COOKIE & RESPONSE
   * ============================================================================
   */
  describe("Successful login with refresh token", () => {
    const loginResult = {
      message: "Login successful",
      data: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        idToken: "id-token",
        expiresIn: 3600
      }
    };

    beforeEach(() => {
      mockLoginService.login.mockResolvedValue(loginResult);
    });

    it("should set refresh token as httpOnly cookie", async () => {
      await loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCookie).toHaveBeenCalledWith("refreshToken", "refresh-token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
      });
    });

    it("should send response without refresh token in body", async () => {
      await loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(OkSuccess).toHaveBeenCalledWith({
        data: {
          accessToken: "access-token",
          idToken: "id-token",
          expiresIn: 3600
        },
        message: "Login successful"
      });
    });

    it("should call send with request and response", async () => {
      await loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockSend).toHaveBeenCalledWith(mockRequest, mockResponse);
    });

    it("should call login service with request", async () => {
      await loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLoginService.login).toHaveBeenCalledWith(mockRequest);
    });
  });

  /*
   * ============================================================================
   * SUCCESSFUL LOGIN - WITHOUT REFRESH TOKEN (EDGE CASE)
   * ============================================================================
   */
  describe("Successful login without refresh token", () => {
    it("should not set cookie when refresh token is undefined", async () => {
      const loginResult = {
        message: "Login successful",
        data: {
          accessToken: "access-token",
          idToken: "id-token",
          expiresIn: 3600
        }
      };

      mockLoginService.login.mockResolvedValue(loginResult as any);

      await loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCookie).not.toHaveBeenCalled();
    });

    it("should not set cookie when refresh token is empty string", async () => {
      const loginResult = {
        message: "Login successful",
        data: {
          accessToken: "access-token",
          refreshToken: "",
          idToken: "id-token",
          expiresIn: 3600
        }
      };

      mockLoginService.login.mockResolvedValue(loginResult);

      await loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Empty string is falsy, so cookie should not be set
      expect(mockCookie).not.toHaveBeenCalled();
    });

    it("should still send response when refresh token is missing", async () => {
      const loginResult = {
        message: "Login successful",
        data: {
          accessToken: "access-token",
          idToken: "id-token",
          expiresIn: 3600
        }
      };

      mockLoginService.login.mockResolvedValue(loginResult as any);

      await loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(OkSuccess).toHaveBeenCalledWith({
        data: {
          accessToken: "access-token",
          idToken: "id-token",
          expiresIn: 3600
        },
        message: "Login successful"
      });
      expect(mockSend).toHaveBeenCalled();
    });
  });

  /*
   * ============================================================================
   * RESPONSE DATA STRUCTURE
   * ============================================================================
   */
  describe("Response data structure", () => {
    it("should exclude refreshToken from response body", async () => {
      const loginResult = {
        message: "Login successful",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          idToken: "id-token",
          expiresIn: 3600
        }
      };

      mockLoginService.login.mockResolvedValue(loginResult);

      await loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const okSuccessCall = (OkSuccess as jest.Mock).mock.calls[0][0];
      expect(okSuccessCall.data).not.toHaveProperty("refreshToken");
      expect(okSuccessCall.data).toHaveProperty("accessToken");
      expect(okSuccessCall.data).toHaveProperty("idToken");
      expect(okSuccessCall.data).toHaveProperty("expiresIn");
    });

    it("should preserve all non-token fields in response", async () => {
      const loginResult = {
        message: "Custom message",
        data: {
          accessToken: "at",
          refreshToken: "rt",
          idToken: "it",
          expiresIn: 7200
        }
      };

      mockLoginService.login.mockResolvedValue(loginResult);

      await loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(OkSuccess).toHaveBeenCalledWith({
        data: {
          accessToken: "at",
          idToken: "it",
          expiresIn: 7200
        },
        message: "Custom message"
      });
    });
  });

  /*
   * ============================================================================
   * ERROR PROPAGATION (asyncHandler passes errors to next)
   * ============================================================================
   */
  describe("Error handling", () => {
    it("should pass UnauthorizedError to next middleware", async () => {
      const error = new Error("Invalid credentials");
      error.name = "UnauthorizedError";
      mockLoginService.login.mockRejectedValue(error);

      loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operation to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should pass BadRequestError to next middleware", async () => {
      const error = new Error("Account locked");
      error.name = "BadRequestError";
      mockLoginService.login.mockRejectedValue(error);

      loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operation to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should not set cookie when service throws error", async () => {
      mockLoginService.login.mockRejectedValue(new Error("Service error"));

      loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operation to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockCookie).not.toHaveBeenCalled();
    });

    it("should not send success response when service throws error", async () => {
      mockLoginService.login.mockRejectedValue(new Error("Service error"));

      loginController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Wait for async operation to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  /*
   * ============================================================================
   * INPUT HANDLING
   * ============================================================================
   */
  describe("Input handling", () => {
    it("should pass request body to service", async () => {
      const customRequest = {
        body: {
          email: "custom@example.com",
          password: "customPassword123"
        },
        t: jest.fn((key: string) => key),
        language: "vi"
      };

      const loginResult = {
        message: "Success",
        data: {
          accessToken: "at",
          refreshToken: "rt",
          idToken: "it",
          expiresIn: 3600
        }
      };

      mockLoginService.login.mockResolvedValue(loginResult);

      await loginController(
        customRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLoginService.login).toHaveBeenCalledWith(customRequest);
    });

    it("should handle request with different language", async () => {
      const viRequest = {
        body: {
          email: "user@example.com",
          password: "password"
        },
        t: jest.fn((key: string) => key),
        language: "vi"
      };

      const loginResult = {
        message: "Đăng nhập thành công",
        data: {
          accessToken: "at",
          refreshToken: "rt",
          idToken: "it",
          expiresIn: 3600
        }
      };

      mockLoginService.login.mockResolvedValue(loginResult);

      await loginController(
        viRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(OkSuccess).toHaveBeenCalledWith({
        data: expect.any(Object),
        message: "Đăng nhập thành công"
      });
    });
  });
});
