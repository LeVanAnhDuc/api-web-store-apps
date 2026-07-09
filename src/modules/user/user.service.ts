// types
import type {
  CreateUserData,
  UserDocument,
  UserRecord,
  UpdateProfileData,
  UserWithAuth,
  AdminUsersQuery,
  AdminUsersFilter,
  AdminUserListMeta
} from "@/modules/user/types";
import type { ClientSession } from "mongoose";
import type { UserRepository } from "./user.repository";
import type {
  MyProfileDto,
  PublicProfileDto,
  AdminUserDto,
  AdminUserOptionDto
} from "./dtos";
// common
import { NotFoundError } from "@/common/exceptions";
import { PAGINATION } from "@/common/pagination";
import { resolveSortDirection } from "@/common/sort";
// validators
import { validateEmail, validateObjectId } from "@/validators/utils";
// dtos
import {
  toMyProfileDto,
  toPublicProfileDto,
  toAdminUserDto,
  toAdminUserOptionDto
} from "./dtos";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/libs/logger";
import { RequestContext } from "@/utils/request-context";

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getMyProfile(): Promise<MyProfileDto> {
    const userId = RequestContext.requireUserId();
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError({
        i18nMessage: (t) => t("user:errors.notFound"),
        code: ERROR_CODES.USER_NOT_FOUND
      });
    }

    return toMyProfileDto(user, user.avatar ?? null);
  }

  async updateMyProfile(
    data: Partial<UpdateProfileData>
  ): Promise<MyProfileDto> {
    const userId = RequestContext.requireUserId();
    const user = await this.userRepo.updateById(userId, data);

    if (!user) {
      throw new NotFoundError({
        i18nMessage: (t) => t("user:errors.notFound"),
        code: ERROR_CODES.USER_NOT_FOUND
      });
    }

    return toMyProfileDto(user, user.avatar ?? null);
  }

  async getPublicProfile(userId: string): Promise<PublicProfileDto> {
    const user = await this.userRepo.findPublicById(userId);

    if (!user) {
      throw new NotFoundError({
        i18nMessage: (t) => t("user:errors.notFound"),
        code: ERROR_CODES.USER_NOT_FOUND
      });
    }

    return toPublicProfileDto(user, user.avatar ?? null);
  }

  async createProfile(
    data: CreateUserData,
    session?: ClientSession
  ): Promise<UserRecord> {
    return this.userRepo.createProfile(data, session);
  }

  async emailExists(email: string): Promise<boolean> {
    validateEmail(email);

    try {
      return await this.userRepo.emailExists(email);
    } catch (error) {
      Logger.error("Failed to check email existence", { email, error });
      throw error;
    }
  }

  async findByEmailWithAuth(email: string): Promise<UserWithAuth | null> {
    validateEmail(email);

    try {
      return await this.userRepo.findByEmailWithAuth(email);
    } catch (error) {
      Logger.error("Failed to find auth by email", { email, error });
      throw error;
    }
  }

  async findByAuthId(authId: string): Promise<{
    _id: UserDocument["_id"];
    email: string;
    fullName: string;
    avatar?: string | null;
  } | null> {
    validateObjectId(authId, "authId");

    try {
      return await this.userRepo.findByAuthId(authId);
    } catch (error) {
      Logger.error("Failed to find user by auth ID", { authId, error });
      throw error;
    }
  }

  async getAdminUsers(
    query: AdminUsersQuery
  ): Promise<{ items: AdminUserDto[]; meta: AdminUserListMeta }> {
    const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = PAGINATION;
    const {
      page = DEFAULT_PAGE,
      limit: rawLimit = DEFAULT_LIMIT,
      sortBy = "createdAt",
      sortOrder: rawSortOrder,
      search,
      role,
      status
    } = query;

    const limit = Math.min(rawLimit, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const sortOrder = resolveSortDirection(rawSortOrder);

    const filter: AdminUsersFilter = {
      ...(search ? { search } : {}),
      ...(role ? { role } : {}),
      ...(status ? { isActive: status === "active" } : {})
    };

    const { data, total } = await this.userRepo.findAdminUsers(filter, {
      skip,
      limit,
      sort: { [sortBy]: sortOrder }
    });

    return {
      items: data.map(toAdminUserDto),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getAdminUserOptions(): Promise<AdminUserOptionDto[]> {
    const rows = await this.userRepo.findAdminUserOptions();
    return rows.map(toAdminUserOptionDto);
  }
}
