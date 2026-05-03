// types
import type { Request } from "express";
import type { MagicLinkLoginRepository } from "../repositories";
// common
import { BadRequestError } from "@/common/exceptions";
// others
import { makeMockRequest } from "@test/helpers/request.helper";
import { createMagicLinkLoginRepoMock } from "@test/mocks/magic-link-login-repo.mock";
import { MagicLinkCooldownGuard } from "./magic-link-cooldown.guard";
import { ERROR_CODES } from "@/constants/error-code";

const EMAIL = "user@example.com";

describe("MagicLinkCooldownGuard", () => {
  let req: Request;
  let tSpy: jest.Mock;
  let repo: jest.Mocked<MagicLinkLoginRepository>;
  let guard: MagicLinkCooldownGuard;

  beforeEach(() => {
    req = makeMockRequest();
    tSpy = req.t as unknown as jest.Mock;
    repo = createMagicLinkLoginRepoMock();
    guard = new MagicLinkCooldownGuard(repo);
  });

  it("returns silently when cooldown has expired", async () => {
    repo.getCooldownRemaining.mockResolvedValue(0);

    await expect(guard.assert(EMAIL, req.t)).resolves.toBeUndefined();
  });

  it("throws LOGIN_MAGIC_LINK_COOLDOWN with interpolated seconds when cooldown is active", async () => {
    repo.getCooldownRemaining.mockResolvedValue(77);

    const promise = guard.assert(EMAIL, req.t);

    await expect(promise).rejects.toBeInstanceOf(BadRequestError);
    await expect(promise).rejects.toMatchObject({
      code: ERROR_CODES.LOGIN_MAGIC_LINK_COOLDOWN
    });
    expect(tSpy).toHaveBeenCalledWith("login:errors.magicLinkCooldown", {
      seconds: 77
    });
  });
});
