// service
import { WebAppService } from "./web-app.service";
// modules
import { WEB_APP_STATUSES } from "./constants";
import { ConflictRequestError, NotFoundError } from "@/common/exceptions";

const makeRepos = () => {
  const webAppRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findActivePaginated: jest.fn().mockResolvedValue([]),
    countActive: jest.fn().mockResolvedValue(0),
    existsByName: jest.fn().mockResolvedValue(false),
    existsByNameExcludingId: jest.fn().mockResolvedValue(false),
    create: jest.fn(),
    updateById: jest.fn()
  };
  const categoryRepo = {
    findAll: jest.fn(),
    existsById: jest.fn().mockResolvedValue(true)
  };
  return { webAppRepo, categoryRepo };
};

const validBody = {
  name: "blog",
  displayName: "Blog",
  description: "",
  iconUrl: "",
  homeUrl: "https://blog.example.com",
  categoryId: "6a24f14e6d65650b697c34c5",
  status: "active" as const,
  requiredRoles: ["user" as const],
  redirectUris: ["https://blog.example.com/cb"]
};

const createdDoc = {
  _id: { toString: () => "app1" },
  categoryId: { toString: () => "6a24f14e6d65650b697c34c5" },
  name: "blog",
  displayName: "Blog",
  description: null,
  iconUrl: null,
  homeUrl: "https://blog.example.com",
  clientId: "client_generated",
  clientSecretHash: "hashed",
  redirectUris: ["https://blog.example.com/cb"],
  requiredRoles: ["user"],
  status: WEB_APP_STATUSES.ACTIVE,
  createdAt: new Date("2026-06-07T00:00:00.000Z"),
  updatedAt: new Date("2026-06-07T00:00:00.000Z")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("WebAppService.createApp", () => {
  it("throws ConflictRequestError when the name already exists", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.existsByName.mockResolvedValue(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);
    await expect(service.createApp(validBody)).rejects.toBeInstanceOf(
      ConflictRequestError
    );
    expect(webAppRepo.create).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the category does not exist", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    categoryRepo.existsById.mockResolvedValue(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);
    await expect(service.createApp(validBody)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(webAppRepo.create).not.toHaveBeenCalled();
  });

  it("generates credentials, hashes the secret, persists, and returns it once", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.create.mockResolvedValue(createdDoc);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);

    const result = await service.createApp(validBody);

    const persisted = webAppRepo.create.mock.calls[0][0];
    expect(persisted.clientId).toMatch(/^client_/);
    expect(persisted.clientSecretHash).not.toBe("");
    expect(persisted.clientSecretHash).not.toMatch(/^[a-f0-9]{64}$/); // hashed, not raw secret
    expect(persisted.status).toBe(WEB_APP_STATUSES.ACTIVE);
    expect(persisted.scopes).toEqual(["openid", "profile", "email"]);
    expect(persisted.description).toBeNull(); // "" → null
    expect(persisted.name).toBe(validBody.name);
    expect(persisted.categoryId).toBe(validBody.categoryId);
    expect(persisted.homeUrl).toBe(validBody.homeUrl);
    expect(persisted.redirectUris).toEqual(validBody.redirectUris);
    expect(result.clientSecret).toMatch(/^[a-f0-9]{64}$/);
    expect(result.clientId).toBe("client_generated");
  });
});

const existingDoc = {
  _id: { toString: () => "app1" },
  categoryId: { toString: () => "6a24f14e6d65650b697c34c5" },
  name: "blog",
  displayName: "Blog",
  description: null,
  iconUrl: null,
  homeUrl: "https://blog.example.com",
  clientId: "client_blog",
  clientSecretHash: "hashed",
  redirectUris: ["https://blog.example.com/cb"],
  requiredRoles: ["user"],
  status: WEB_APP_STATUSES.ACTIVE,
  createdAt: new Date("2026-06-07T00:00:00.000Z"),
  updatedAt: new Date("2026-06-07T00:00:00.000Z")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("WebAppService.updateApp", () => {
  it("throws NotFoundError when the app does not exist", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.findById.mockResolvedValue(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);
    await expect(
      service.updateApp("app1", { displayName: "New" })
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(webAppRepo.updateById).not.toHaveBeenCalled();
  });

  it("throws ConflictRequestError when renaming to a name owned by another app", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.findById.mockResolvedValue(existingDoc);
    webAppRepo.existsByNameExcludingId.mockResolvedValue(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);
    await expect(
      service.updateApp("app1", { name: "taken" })
    ).rejects.toBeInstanceOf(ConflictRequestError);
    expect(webAppRepo.updateById).not.toHaveBeenCalled();
  });

  it("skips the name check when the name is unchanged", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.findById.mockResolvedValue(existingDoc);
    webAppRepo.updateById.mockResolvedValue(existingDoc);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);
    await service.updateApp("app1", { name: "blog", displayName: "Blog 2" });
    expect(webAppRepo.existsByNameExcludingId).not.toHaveBeenCalled();
    expect(webAppRepo.updateById).toHaveBeenCalled();
  });

  it("throws NotFoundError when the new category does not exist", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.findById.mockResolvedValue(existingDoc);
    categoryRepo.existsById.mockResolvedValue(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);
    await expect(
      service.updateApp("app1", { categoryId: "6a24f14e6d65650b697c34c6" })
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(webAppRepo.updateById).not.toHaveBeenCalled();
  });

  it("maps public status to internal when hiding (inactive)", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.findById.mockResolvedValue(existingDoc);
    webAppRepo.updateById.mockResolvedValue({
      ...existingDoc,
      status: WEB_APP_STATUSES.INACTIVE
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);
    const result = await service.updateApp("app1", { status: "inactive" });
    const persisted = webAppRepo.updateById.mock.calls[0][1];
    expect(persisted.status).toBe(WEB_APP_STATUSES.INACTIVE);
    expect(result.status).toBe("inactive");
  });

  it("maps public status to internal when unhiding (active)", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.findById.mockResolvedValue({
      ...existingDoc,
      status: WEB_APP_STATUSES.INACTIVE
    });
    webAppRepo.updateById.mockResolvedValue({
      ...existingDoc,
      status: WEB_APP_STATUSES.ACTIVE
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);
    const result = await service.updateApp("app1", { status: "active" });
    const persisted = webAppRepo.updateById.mock.calls[0][1];
    expect(persisted.status).toBe(WEB_APP_STATUSES.ACTIVE);
    expect(result.status).toBe("active");
  });

  it("only persists provided fields and returns the mapped DTO", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.findById.mockResolvedValue(existingDoc);
    webAppRepo.updateById.mockResolvedValue({
      ...existingDoc,
      displayName: "Renamed"
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);
    const result = await service.updateApp("app1", { displayName: "Renamed" });
    const persisted = webAppRepo.updateById.mock.calls[0][1];
    expect(Object.keys(persisted)).toEqual(["displayName"]);
    expect(result.displayName).toBe("Renamed");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).clientSecret).toBeUndefined();
  });
});

describe("WebAppService.listUserApps", () => {
  const activeDoc = {
    _id: { toString: () => "app1" },
    displayName: "Blog",
    description: "A blog",
    iconUrl: null,
    homeUrl: "https://blog.example.com",
    category: { displayName: "Content" }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  it("forces an ACTIVE-only filter and applies search", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.findActivePaginated.mockResolvedValue([activeDoc]);
    webAppRepo.countActive.mockResolvedValue(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);

    await service.listUserApps({ search: "blog" });

    const filter = webAppRepo.findActivePaginated.mock.calls[0][0];
    expect(filter.status).toBe(WEB_APP_STATUSES.ACTIVE);
    expect(filter.$or).toHaveLength(3);
  });

  it("maps docs to UserAppDto and computes pagination meta", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.findActivePaginated.mockResolvedValue([activeDoc]);
    webAppRepo.countActive.mockResolvedValue(25);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);

    const result = await service.listUserApps({ page: 2, limit: 12 });

    expect(result.items[0]).toEqual({
      _id: "app1",
      displayName: "Blog",
      description: "A blog",
      iconUrl: null,
      homeUrl: "https://blog.example.com",
      category: "Content"
    });
    expect(result.meta).toEqual({
      total: 25,
      page: 2,
      limit: 12,
      totalPages: 3
    });
    const { skip, limit } = webAppRepo.findActivePaginated.mock.calls[0][1];
    expect(skip).toBe(12);
    expect(limit).toBe(12);
  });

  it("clamps limit to MAX_LIMIT and defaults page/limit", async () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.findActivePaginated.mockResolvedValue([]);
    webAppRepo.countActive.mockResolvedValue(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);

    const result = await service.listUserApps({ limit: 9999 });

    const { skip, limit } = webAppRepo.findActivePaginated.mock.calls[0][1];
    expect(limit).toBe(100);
    expect(skip).toBe(0);
    expect(result.meta.page).toBe(1);
    expect(result.meta.totalPages).toBe(1);
  });
});

describe("WebAppService.listUserApps role visibility", () => {
  const setup = () => {
    const { webAppRepo, categoryRepo } = makeRepos();
    webAppRepo.findActivePaginated.mockResolvedValue([]);
    webAppRepo.countActive.mockResolvedValue(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new WebAppService(webAppRepo as any, categoryRepo as any);
    return { webAppRepo, service };
  };

  it("restricts a non-admin (user) to apps requiring their role", async () => {
    const { webAppRepo, service } = setup();
    await service.listUserApps({}, "user");
    const filter = webAppRepo.findActivePaginated.mock.calls[0][0];
    expect(filter.requiredRoles).toBe("user");
    expect(filter.status).toBe(WEB_APP_STATUSES.ACTIVE);
  });

  it("does not role-filter for an admin (sees the full active catalog)", async () => {
    const { webAppRepo, service } = setup();
    await service.listUserApps({}, "admin");
    const filter = webAppRepo.findActivePaginated.mock.calls[0][0];
    expect(filter.requiredRoles).toBeUndefined();
    expect(filter.status).toBe(WEB_APP_STATUSES.ACTIVE);
  });

  it("defaults to the user role when no role is provided (least exposure)", async () => {
    const { webAppRepo, service } = setup();
    await service.listUserApps({});
    const filter = webAppRepo.findActivePaginated.mock.calls[0][0];
    expect(filter.requiredRoles).toBe("user");
  });
});
