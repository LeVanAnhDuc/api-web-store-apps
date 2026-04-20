// types
import type { Request } from "express";
import type { OtpLoginRepository } from "../repositories/otp-login.repository";
// config
import { BadRequestError } from "@/config/responses/error";
// others
import { OtpCooldownGuard } from "./otp-cooldown.guard";
import { ERROR_CODES } from "@/constants/error-code";
import { makeMockRequest } from "@test/helpers/request.helper";
import { createOtpLoginRepoMock } from "@test/mocks/otp-login-repo.mock";

const EMAIL = "user@example.com";

describe("OtpCooldownGuard", () => {
  let req: Request;
  let tSpy: jest.Mock;
  let repo: jest.Mocked<OtpLoginRepository>;
  let guard: OtpCooldownGuard;

  beforeEach(() => {
    req = makeMockRequest();
    tSpy = req.t as unknown as jest.Mock;
    repo = createOtpLoginRepoMock();
    guard = new OtpCooldownGuard(repo);
  });

  it("returns silently when cooldown expired", async () => {
    repo.checkCooldown.mockResolvedValue(true);

    await expect(guard.assert(EMAIL, req.t)).resolves.toBeUndefined();
    expect(repo.getCooldownRemaining).not.toHaveBeenCalled();
  });

  it("throws LOGIN_OTP_COOLDOWN with interpolated seconds when active", async () => {
    repo.checkCooldown.mockResolvedValue(false);
    repo.getCooldownRemaining.mockResolvedValue(42);

    const promise = guard.assert(EMAIL, req.t);

    await expect(promise).rejects.toBeInstanceOf(BadRequestError);
    await expect(promise).rejects.toMatchObject({
      code: ERROR_CODES.LOGIN_OTP_COOLDOWN
    });
    expect(tSpy).toHaveBeenCalledWith("login:errors.otpCooldown", {
      seconds: 42
    });
  });
});
