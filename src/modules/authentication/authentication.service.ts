import type {
  AuthenticationDocument,
  AuthenticationRecord,
  CreateAuthenticationData
} from "@/types/modules/authentication";
import { Logger } from "@/utils/logger";
import {
  validateEmail,
  validateObjectId,
  validateRequiredString
} from "@/validators/utils";
import type { AuthenticationRepository } from "./repositories/authentication.repository";

export class AuthenticationService {
  constructor(private readonly authRepo: AuthenticationRepository) {}

  async findByEmail(email: string): Promise<AuthenticationDocument | null> {
    validateEmail(email);

    try {
      return await this.authRepo.findByEmail(email);
    } catch (error) {
      Logger.error("Failed to find authentication by email", { email, error });
      throw error;
    }
  }

  async findById(authId: string): Promise<AuthenticationDocument | null> {
    validateObjectId(authId, "authId");

    try {
      return await this.authRepo.findById(authId);
    } catch (error) {
      Logger.error("Failed to find authentication by ID", { authId, error });
      throw error;
    }
  }

  async emailExists(email: string): Promise<boolean> {
    validateEmail(email);

    try {
      return await this.authRepo.emailExists(email);
    } catch (error) {
      Logger.error("Failed to check email existence", { email, error });
      throw error;
    }
  }

  async create(data: CreateAuthenticationData): Promise<AuthenticationRecord> {
    validateEmail(data.email);
    validateRequiredString(data.hashedPassword, "hashedPassword");

    try {
      const record = await this.authRepo.create(data);
      Logger.info("New authentication record created", {
        authId: record._id.toString(),
        email: record.email
      });
      return record;
    } catch (error) {
      Logger.error("Failed to create authentication record", {
        email: data.email,
        error
      });
      throw error;
    }
  }

  async updatePassword(authId: string, hashedPassword: string): Promise<void> {
    validateObjectId(authId, "authId");
    validateRequiredString(hashedPassword, "hashedPassword");

    try {
      await this.authRepo.updatePassword(authId, hashedPassword);
      Logger.info("Password updated", { authId });
    } catch (error) {
      Logger.error("Failed to update password", { authId, error });
      throw error;
    }
  }

  async storeTempPassword(
    authId: string,
    tempPasswordHash: string,
    tempPasswordExpAt: Date
  ): Promise<void> {
    validateObjectId(authId, "authId");
    validateRequiredString(tempPasswordHash, "tempPasswordHash");

    try {
      await this.authRepo.storeTempPassword(
        authId,
        tempPasswordHash,
        tempPasswordExpAt
      );
      Logger.info("Temporary password stored", {
        authId,
        expiresAt: tempPasswordExpAt
      });
    } catch (error) {
      Logger.error("Failed to store temporary password", { authId, error });
      throw error;
    }
  }

  async markTempPasswordUsed(authId: string): Promise<void> {
    validateObjectId(authId, "authId");

    try {
      await this.authRepo.markTempPasswordUsed(authId);
      Logger.info("Temporary password marked as used", { authId });
    } catch (error) {
      Logger.error("Failed to mark temporary password as used", {
        authId,
        error
      });
      throw error;
    }
  }
}
