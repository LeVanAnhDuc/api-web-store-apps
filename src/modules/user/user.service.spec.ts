jest.mock("@/utils/request-context", () => ({
  RequestContext: { requireUserId: jest.fn(), requireAuthId: jest.fn() }
}));

// types
import type { UserRepository } from "./user.repository";
import { UserService } from "./user.service";

const buildRepo = (over: Partial<UserRepository> = {}): UserRepository =>
  ({
    findAdminUsers: jest.fn(),
    ...over
  }) as unknown as UserRepository;

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
    const service = new UserService(buildRepo({ findAdminUsers }));

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
    const service = new UserService(buildRepo({ findAdminUsers }));

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
