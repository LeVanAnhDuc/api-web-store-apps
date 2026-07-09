// types
import type { AdminUserOptionRow } from "@/modules/user/types";
// dtos
import { toAdminUserOptionDto } from "./admin-user-option.dto";

const baseRow = (): AdminUserOptionRow => ({
  _id: {
    toString: () => "user1"
  } as unknown as AdminUserOptionRow["_id"],
  fullName: "Alice",
  email: "alice@example.com",
  role: "admin"
});

describe("toAdminUserOptionDto", () => {
  it("maps id/fullName/email/role and stringifies the ObjectId", () => {
    expect(toAdminUserOptionDto(baseRow())).toEqual({
      _id: "user1",
      fullName: "Alice",
      email: "alice@example.com",
      role: "admin"
    });
  });

  it("preserves the user role", () => {
    const dto = toAdminUserOptionDto({ ...baseRow(), role: "user" });
    expect(dto.role).toBe("user");
  });
});
