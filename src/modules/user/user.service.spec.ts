jest.mock("@/utils/request-context", () => ({
  RequestContext: { requireUserId: jest.fn(), requireAuthId: jest.fn() }
}));

// types
import type { UserRepository } from "./user.repository";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import { UserService } from "./user.service";
// common
import { ForbiddenError, NotFoundError } from "@/common/exceptions";
// others
import { RequestContext } from "@/utils/request-context";

const buildRepo = (over: Partial<UserRepository> = {}): UserRepository =>
  ({
    findAdminUsers: jest.fn(),
    ...over
  }) as unknown as UserRepository;

const buildAuthService = (
  over: Partial<AuthenticationService> = {}
): AuthenticationService =>
  ({
    setActive: jest.fn(),
    findById: jest.fn().mockResolvedValue({ roles: "user", isActive: true }),
    countActiveAdmins: jest.fn().mockResolvedValue(2),
    ...over
  }) as unknown as AuthenticationService;

describe("UserService.getAdminUsers", () => {
  it("maps rows to DTOs and computes pagination meta", async () => {
    const findAdminUsers = jest.fn().mockResolvedValue({
      data: [
        {
          _id: { toString: () => "u1" },
          fullName: "A",
          email: "a@e.vn",
          avatar: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          role: "user",
          isActive: true,
          lastLoginAt: null
        }
      ],
      total: 25
    });
    const service = new UserService(
      buildRepo({ findAdminUsers }),
      buildAuthService()
    );

    const result = await service.getAdminUsers({ page: 2, limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]._id).toBe("u1");
    expect(result.meta).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3
    });
    expect(findAdminUsers).toHaveBeenCalledWith(
      {},
      { skip: 10, limit: 10, sort: { createdAt: -1 } }
    );
  });

  it("translates status filter to isActive and defaults sort", async () => {
    const findAdminUsers = jest.fn().mockResolvedValue({ data: [], total: 0 });
    const service = new UserService(
      buildRepo({ findAdminUsers }),
      buildAuthService()
    );

    await service.getAdminUsers({
      status: "locked",
      search: "x",
      role: "admin"
    });

    expect(findAdminUsers).toHaveBeenCalledWith(
      { search: "x", role: "admin", isActive: false },
      { skip: 0, limit: 20, sort: { createdAt: -1 } }
    );
  });
});

describe("UserService.setUserActive", () => {
  const targetUserId = "64f1b2c3d4e5f6a7b8c9d0e1";
  const targetAuthId = "64f1b2c3d4e5f6a7b8c9d0e2";
  const adminAuthId = "64f1b2c3d4e5f6a7b8c9d0e3";

  beforeEach(() => {
    jest.mocked(RequestContext.requireAuthId).mockReturnValue(adminAuthId);
  });

  it("locks a non-admin user and returns the result", async () => {
    const findAuthIdById = jest
      .fn()
      .mockResolvedValue({ authId: targetAuthId });
    const setActive = jest.fn().mockResolvedValue(undefined);
    const findById = jest
      .fn()
      .mockResolvedValue({ roles: "user", isActive: true });
    const countActiveAdmins = jest.fn().mockResolvedValue(0);
    const service = new UserService(
      buildRepo({ findAuthIdById }),
      buildAuthService({ setActive, findById, countActiveAdmins })
    );

    const result = await service.setUserActive(targetUserId, false);

    expect(result).toEqual({ _id: targetUserId, isActive: false });
    expect(setActive).toHaveBeenCalledWith(targetAuthId, false);
  });

  it("locks an admin when other active admins remain", async () => {
    const findAuthIdById = jest
      .fn()
      .mockResolvedValue({ authId: targetAuthId });
    const setActive = jest.fn().mockResolvedValue(undefined);
    const findById = jest
      .fn()
      .mockResolvedValue({ roles: "admin", isActive: true });
    const countActiveAdmins = jest.fn().mockResolvedValue(2);
    const service = new UserService(
      buildRepo({ findAuthIdById }),
      buildAuthService({ setActive, findById, countActiveAdmins })
    );

    const result = await service.setUserActive(targetUserId, false);

    expect(result).toEqual({ _id: targetUserId, isActive: false });
    expect(setActive).toHaveBeenCalledWith(targetAuthId, false);
  });

  it("throws ForbiddenError when locking the last active admin", async () => {
    const findAuthIdById = jest
      .fn()
      .mockResolvedValue({ authId: targetAuthId });
    const setActive = jest.fn();
    const findById = jest
      .fn()
      .mockResolvedValue({ roles: "admin", isActive: true });
    const countActiveAdmins = jest.fn().mockResolvedValue(1);
    const service = new UserService(
      buildRepo({ findAuthIdById }),
      buildAuthService({ setActive, findById, countActiveAdmins })
    );

    await expect(service.setUserActive(targetUserId, false)).rejects.toThrow(
      ForbiddenError
    );
    expect(setActive).not.toHaveBeenCalled();
  });

  it("does not consult countActiveAdmins when locking an admin who is already inactive", async () => {
    const findAuthIdById = jest
      .fn()
      .mockResolvedValue({ authId: targetAuthId });
    const setActive = jest.fn().mockResolvedValue(undefined);
    const findById = jest
      .fn()
      .mockResolvedValue({ roles: "admin", isActive: false });
    const countActiveAdmins = jest.fn().mockResolvedValue(0);
    const service = new UserService(
      buildRepo({ findAuthIdById }),
      buildAuthService({ setActive, findById, countActiveAdmins })
    );

    const result = await service.setUserActive(targetUserId, false);

    expect(result).toEqual({ _id: targetUserId, isActive: false });
    expect(countActiveAdmins).not.toHaveBeenCalled();
    expect(setActive).toHaveBeenCalledWith(targetAuthId, false);
  });

  it("unlocks a user and returns the result", async () => {
    const findAuthIdById = jest
      .fn()
      .mockResolvedValue({ authId: targetAuthId });
    const setActive = jest.fn().mockResolvedValue(undefined);
    const service = new UserService(
      buildRepo({ findAuthIdById }),
      buildAuthService({ setActive })
    );

    const result = await service.setUserActive(targetUserId, true);

    expect(result).toEqual({ _id: targetUserId, isActive: true });
    expect(setActive).toHaveBeenCalledWith(targetAuthId, true);
  });

  it("throws NotFoundError and does not call setActive when target does not exist", async () => {
    const findAuthIdById = jest.fn().mockResolvedValue(null);
    const setActive = jest.fn();
    const service = new UserService(
      buildRepo({ findAuthIdById }),
      buildAuthService({ setActive })
    );

    await expect(service.setUserActive(targetUserId, false)).rejects.toThrow(
      NotFoundError
    );
    expect(setActive).not.toHaveBeenCalled();
  });

  it("throws ForbiddenError when an admin tries to lock their own account", async () => {
    const findAuthIdById = jest.fn().mockResolvedValue({ authId: adminAuthId });
    const setActive = jest.fn();
    const service = new UserService(
      buildRepo({ findAuthIdById }),
      buildAuthService({ setActive })
    );

    await expect(service.setUserActive(targetUserId, false)).rejects.toThrow(
      ForbiddenError
    );
    expect(setActive).not.toHaveBeenCalled();
  });

  it("allows an admin to unlock their own account", async () => {
    const findAuthIdById = jest.fn().mockResolvedValue({ authId: adminAuthId });
    const setActive = jest.fn().mockResolvedValue(undefined);
    const service = new UserService(
      buildRepo({ findAuthIdById }),
      buildAuthService({ setActive })
    );

    const result = await service.setUserActive(targetUserId, true);

    expect(result).toEqual({ _id: targetUserId, isActive: true });
    expect(setActive).toHaveBeenCalledWith(adminAuthId, true);
  });

  it("is idempotent — calls setActive even if the account is already in the target state", async () => {
    const findAuthIdById = jest
      .fn()
      .mockResolvedValue({ authId: targetAuthId });
    const setActive = jest.fn().mockResolvedValue(undefined);
    const service = new UserService(
      buildRepo({ findAuthIdById }),
      buildAuthService({ setActive })
    );

    await service.setUserActive(targetUserId, false);
    await service.setUserActive(targetUserId, false);

    expect(setActive).toHaveBeenCalledTimes(2);
    expect(setActive).toHaveBeenNthCalledWith(1, targetAuthId, false);
    expect(setActive).toHaveBeenNthCalledWith(2, targetAuthId, false);
  });

  it("unlocking the last active admin is never blocked by the last-admin guard", async () => {
    const findAuthIdById = jest
      .fn()
      .mockResolvedValue({ authId: targetAuthId });
    const setActive = jest.fn().mockResolvedValue(undefined);
    const findById = jest
      .fn()
      .mockResolvedValue({ roles: "admin", isActive: false });
    const countActiveAdmins = jest.fn().mockResolvedValue(1);
    const service = new UserService(
      buildRepo({ findAuthIdById }),
      buildAuthService({ setActive, findById, countActiveAdmins })
    );

    const result = await service.setUserActive(targetUserId, true);

    expect(result).toEqual({ _id: targetUserId, isActive: true });
    expect(findById).not.toHaveBeenCalled();
    expect(countActiveAdmins).not.toHaveBeenCalled();
    expect(setActive).toHaveBeenCalledWith(targetAuthId, true);
  });
});
