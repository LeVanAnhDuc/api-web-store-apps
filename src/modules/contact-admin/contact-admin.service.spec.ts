// types
import type { ContactRepository } from "./contact-admin.repository";
// modules
import { ContactAdminService } from "./contact-admin.service";
import { CONTACT_STATUSES, CONTACT_PRIORITIES } from "./constants";
import { RequestContext } from "@/utils/request-context";

const USER = "507f1f77bcf86cd799439011";

const makeDoc = (overrides: Partial<Record<string, unknown>> = {}) => ({
  _id: { toString: () => overrides.id ?? "contact1" },
  email: null,
  subject: "Subject",
  message: "Message body long enough to pass validation",
  priority: CONTACT_PRIORITIES.MEDIUM,
  status: CONTACT_STATUSES.NEW,
  userId: null,
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  ...overrides
});

const makeDeps = () => {
  const contactRepo = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn()
  };
  const makeService = () =>
    new ContactAdminService(contactRepo as unknown as ContactRepository);
  return { contactRepo, makeService };
};

describe("ContactAdminService", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("submitContact", () => {
    it("attaches userId from RequestContext when caller is authenticated", async () => {
      jest.spyOn(RequestContext, "getUserId").mockReturnValue(USER);
      const { contactRepo, makeService } = makeDeps();
      contactRepo.create.mockResolvedValue(makeDoc({ userId: USER }));
      const svc = makeService();

      await svc.submitContact({
        subject: "Cannot login",
        message: "This is a long enough message for validation to pass."
      });

      expect(contactRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER })
      );
    });

    it("sets userId null for a guest (unauthenticated) submit", async () => {
      jest.spyOn(RequestContext, "getUserId").mockReturnValue(undefined);
      const { contactRepo, makeService } = makeDeps();
      contactRepo.create.mockResolvedValue(makeDoc({ userId: null }));
      const svc = makeService();

      await svc.submitContact({
        subject: "Cannot login",
        message: "This is a long enough message for validation to pass."
      });

      expect(contactRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null })
      );
    });
  });
});
