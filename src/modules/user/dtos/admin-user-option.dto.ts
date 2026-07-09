// types
import type { AdminUserOptionRow, AdminUserRole } from "@/modules/user/types";

export interface AdminUserOptionDto {
  _id: string;
  fullName: string;
  email: string;
  role: AdminUserRole;
}

export const toAdminUserOptionDto = (
  row: AdminUserOptionRow
): AdminUserOptionDto => ({
  _id: row._id.toString(),
  fullName: row.fullName,
  email: row.email,
  role: row.role
});
