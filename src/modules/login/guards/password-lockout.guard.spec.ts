jest.mock("@/utils/date");
// types
import type { Request } from "express";
import type { FailedAttemptsRepository } from "../repositories";
// config
import { TooManyRequestsError } from "@/config/responses/error";
// others
import { PasswordLockoutGuard } from "./password-lockout.guard";
import { ERROR_CODES } from "@/constants/error-code";
import { LOGIN_LOCKOUT } from "../constants";
import { formatDuration } from "@/utils/date";
import { makeMockRequest } from "@test/helpers/request.helper";
import { createFailedAttemptsRepoMock } from "@test/mocks/failed-attempts-repo.mock";

const mockedFormatDuration = formatDuration as jest.MockedFunction<
  typeof formatDuration
>;

const EMAIL = "user@example.com";

describe("PasswordLockoutGuard", () => {
  let req: Request;
  let repo: jest.Mocked<FailedAttemptsRepository>;
  let guard: PasswordLockoutGuard;
  let tSpy: jest.Mock;

  beforeEach(() => {
    req = makeMockRequest();
    tSpy = req.t as unknown as jest.Mock;
    repo = createFailedAttemptsRepoMock();
    guard = new PasswordLockoutGuard(repo);
    mockedFormatDuration.mockReturnValue("30 minutes");
  });

  it("returns silently when not locked", async () => {
    repo.checkLockout.mockResolvedValue({
      isLocked: false,
      remainingSeconds: 0
    });

    await expect(guard.assert(EMAIL, "en", req.t)).resolves.toBeUndefined();
    expect(repo.getCount).not.toHaveBeenCalled();
  });

  it("throws LOGIN_ACCOUNT_LOCKED with interpolated attempts+time when locked", async () => {
    repo.checkLockout.mockResolvedValue({
      isLocked: true,
      remainingSeconds: 1800
    });
    repo.getCount.mockResolvedValue(LOGIN_LOCKOUT.MAX_ATTEMPTS);

    const promise = guard.assert(EMAIL, "en", req.t);

    await expect(promise).rejects.toBeInstanceOf(TooManyRequestsError);
    await expect(promise).rejects.toMatchObject({
      code: ERROR_CODES.LOGIN_ACCOUNT_LOCKED
    });
    expect(mockedFormatDuration).toHaveBeenCalledWith(1800, "en");
    expect(tSpy).toHaveBeenCalledWith("login:errors.accountLocked", {
      attempts: LOGIN_LOCKOUT.MAX_ATTEMPTS,
      time: "30 minutes"
    });
  });
});
