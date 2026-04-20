jest.mock("@/utils/retry");
// types
import type { Request } from "express";
import type { OtpLoginRepository } from "../repositories/otp-login.repository";
import type {
  AccountExistsGuard,
  AccountActiveGuard,
  EmailVerifiedGuard,
  OtpLockoutGuard,
  OtpCooldownGuard
} from "../guards";
import type { LoginAuditService } from "../services/login-audit.service";
import type { LoginCompletionService } from "../services/login-completion.service";
import type { EmailDispatcher } from "@/services/email/email.dispatcher";
// config
import { BadRequestError, UnauthorizedError } from "@/config/responses/error";
// others
import { OtpLoginStrategy } from "./otp-login.strategy";
import { EmailType } from "@/types/services/email";
import { ERROR_CODES } from "@/constants/error-code";
import { LOGIN_METHODS } from "@/constants/modules/login-history";
import { LOGIN_OTP_CONFIG } from "@/constants/modules/login";
import { withRetry } from "@/utils/retry";
import { makeMockRequest } from "@test/helpers/request.helper";
import { createOtpLoginRepoMock } from "@test/mocks/otp-login-repo.mock";
import { createEmailDispatcherMock } from "@test/mocks/email-dispatcher.mock";
import {
  createAccountExistsGuardMock,
  createAccountActiveGuardMock,
  createEmailVerifiedGuardMock,
  createOtpLockoutGuardMock,
  createOtpCooldownGuardMock
} from "@test/mocks/login-guards.mock";
import { createLoginAuditServiceMock } from "@test/mocks/login-audit-service.mock";
import { createLoginCompletionServiceMock } from "@test/mocks/login-completion-service.mock";
import { buildUserWithAuth } from "@test/factories/user-with-auth.factory";

const mockedWithRetry = withRetry as jest.MockedFunction<typeof withRetry>;

const EMAIL = "user@example.com";
const OTP_CODE = "123456";

describe("OtpLoginStrategy", () => {
  let req: Request;
  let accountExists: jest.Mocked<AccountExistsGuard>;
  let accountActive: jest.Mocked<AccountActiveGuard>;
  let emailVerified: jest.Mocked<EmailVerifiedGuard>;
  let otpLockout: jest.Mocked<OtpLockoutGuard>;
  let otpCooldown: jest.Mocked<OtpCooldownGuard>;
  let otpRepo: jest.Mocked<OtpLoginRepository>;
  let emailDispatcher: jest.Mocked<EmailDispatcher>;
  let audit: jest.Mocked<LoginAuditService>;
  let completion: jest.Mocked<LoginCompletionService>;
  let strategy: OtpLoginStrategy;

  beforeEach(() => {
    req = makeMockRequest({ language: "en" });
    accountExists = createAccountExistsGuardMock();
    accountActive = createAccountActiveGuardMock();
    emailVerified = createEmailVerifiedGuardMock();
    otpLockout = createOtpLockoutGuardMock();
    otpCooldown = createOtpCooldownGuardMock();
    otpRepo = createOtpLoginRepoMock();
    emailDispatcher = createEmailDispatcherMock();
    audit = createLoginAuditServiceMock();
    completion = createLoginCompletionServiceMock();

    strategy = new OtpLoginStrategy(
      accountExists,
      accountActive,
      emailVerified,
      otpLockout,
      otpCooldown,
      otpRepo,
      emailDispatcher,
      audit,
      completion
    );

    mockedWithRetry.mockImplementation(() => Promise.resolve());
  });

  describe("sendCode", () => {
    it("passes guards, generates OTP, dispatches email, and returns dto", async () => {
      const fixture = buildUserWithAuth();
      accountExists.assert.mockResolvedValue(fixture);
      otpRepo.hasExceededResendLimit.mockResolvedValue(false);
      otpRepo.createAndStoreOtp.mockResolvedValue(OTP_CODE);

      const result = await strategy.sendCode({ email: EMAIL }, req);

      expect(otpCooldown.assert).toHaveBeenCalledWith(EMAIL, req.t);
      expect(accountExists.assert).toHaveBeenCalledWith(EMAIL, req.t);
      expect(accountActive.assert).toHaveBeenCalledWith(fixture.auth, req.t);
      expect(emailVerified.assert).toHaveBeenCalledWith(fixture.auth, req.t);
      expect(otpRepo.createAndStoreOtp).toHaveBeenCalledWith(EMAIL);
      expect(emailDispatcher.send).toHaveBeenCalledWith(
        EmailType.LOGIN_OTP,
        expect.objectContaining({
          email: EMAIL,
          data: {
            otp: OTP_CODE,
            expiryMinutes: LOGIN_OTP_CONFIG.EXPIRY_MINUTES
          }
        })
      );
      expect(result).toEqual({
        success: true,
        expiresIn: otpRepo.OTP_EXPIRY_SECONDS,
        cooldown: otpRepo.OTP_COOLDOWN_SECONDS
      });
    });

    it("throws OTP_RESEND_LIMIT when resend limit exceeded", async () => {
      const fixture = buildUserWithAuth();
      accountExists.assert.mockResolvedValue(fixture);
      otpRepo.hasExceededResendLimit.mockResolvedValue(true);

      const promise = strategy.sendCode({ email: EMAIL }, req);

      await expect(promise).rejects.toBeInstanceOf(BadRequestError);
      await expect(promise).rejects.toMatchObject({
        code: ERROR_CODES.LOGIN_OTP_RESEND_LIMIT
      });
      expect(otpRepo.createAndStoreOtp).not.toHaveBeenCalled();
      expect(emailDispatcher.send).not.toHaveBeenCalled();
    });

    it("short-circuits when accountActive guard throws (no OTP dispatch)", async () => {
      const fixture = buildUserWithAuth();
      accountExists.assert.mockResolvedValue(fixture);
      accountActive.assert.mockImplementation(() => {
        throw new UnauthorizedError(
          "inactive",
          ERROR_CODES.LOGIN_ACCOUNT_INACTIVE
        );
      });

      await expect(
        strategy.sendCode({ email: EMAIL }, req)
      ).rejects.toMatchObject({
        code: ERROR_CODES.LOGIN_ACCOUNT_INACTIVE
      });
      expect(emailVerified.assert).not.toHaveBeenCalled();
      expect(otpRepo.createAndStoreOtp).not.toHaveBeenCalled();
      expect(emailDispatcher.send).not.toHaveBeenCalled();
    });
  });

  describe("verifyCode", () => {
    it("completes login when OTP valid", async () => {
      const fixture = buildUserWithAuth();
      accountExists.assert.mockResolvedValue(fixture);
      otpRepo.verify.mockResolvedValue(true);
      completion.complete.mockReturnValue({
        accessToken: "a",
        refreshToken: "r",
        idToken: "i",
        expiresIn: 3600
      });

      const result = await strategy.verifyCode(
        { email: EMAIL, otp: OTP_CODE },
        req
      );

      expect(otpLockout.assert).toHaveBeenCalledWith(EMAIL, req.t);
      expect(otpRepo.verify).toHaveBeenCalledWith(EMAIL, OTP_CODE);
      expect(completion.complete).toHaveBeenCalledWith({
        auth: fixture.auth,
        user: fixture.user,
        method: LOGIN_METHODS.OTP,
        req
      });
      expect(result).toEqual({
        accessToken: "a",
        refreshToken: "r",
        idToken: "i",
        expiresIn: 3600
      });
    });

    it("tracks and throws OTP_INVALID with remaining count below lockout", async () => {
      const fixture = buildUserWithAuth();
      accountExists.assert.mockResolvedValue(fixture);
      otpRepo.verify.mockResolvedValue(false);
      otpRepo.incrementFailedAttempts.mockResolvedValue(1);

      const promise = strategy.verifyCode({ email: EMAIL, otp: "bad" }, req);

      await expect(promise).rejects.toBeInstanceOf(UnauthorizedError);
      await expect(promise).rejects.toMatchObject({
        code: ERROR_CODES.LOGIN_OTP_INVALID
      });
      expect(audit.recordInvalidOtp).toHaveBeenCalledWith({
        auth: fixture.auth,
        email: EMAIL,
        attempts: 1,
        req
      });
    });

    it("throws OTP_LOCKED when attempts reach MAX_FAILED_ATTEMPTS", async () => {
      const fixture = buildUserWithAuth();
      accountExists.assert.mockResolvedValue(fixture);
      otpRepo.verify.mockResolvedValue(false);
      otpRepo.incrementFailedAttempts.mockResolvedValue(
        LOGIN_OTP_CONFIG.MAX_FAILED_ATTEMPTS
      );

      const promise = strategy.verifyCode({ email: EMAIL, otp: "bad" }, req);

      await expect(promise).rejects.toBeInstanceOf(BadRequestError);
      await expect(promise).rejects.toMatchObject({
        code: ERROR_CODES.LOGIN_OTP_LOCKED
      });
    });
  });
});
