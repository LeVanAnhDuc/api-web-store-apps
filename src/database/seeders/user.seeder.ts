import AuthModel from "@/modules/auth/model";
import UserModel from "@/modules/user/model";
import { hashPassword } from "@/app/utils/crypto/bcrypt";
import { TEST_USERS } from "./data/users";
import { Logger } from "@/infra/utils/logger";

export const seedUsers = async (): Promise<void> => {
  Logger.info("Starting user seeding...");

  let createdCount = 0;
  let skippedCount = 0;

  for (const testUser of TEST_USERS) {
    const existingAuth = await AuthModel.findOne({
      email: testUser.auth.email
    });

    if (existingAuth) {
      Logger.warn(`User already exists: ${testUser.auth.email}, skipping...`);
      skippedCount++;
      continue;
    }

    const hashedPassword = hashPassword(testUser.auth.password);

    const auth = await AuthModel.create({
      email: testUser.auth.email,
      password: hashedPassword,
      roles: testUser.auth.roles,
      verifiedEmail: testUser.auth.verifiedEmail,
      isActive: testUser.auth.isActive
    });

    await UserModel.create({
      authId: auth._id,
      fullName: testUser.user.fullName,
      gender: testUser.user.gender,
      dateOfBirth: testUser.user.dateOfBirth
    });

    Logger.info(`Created user: ${testUser.auth.email}`);
    createdCount++;
  }

  Logger.info(
    `User seeding completed. Created: ${createdCount}, Skipped: ${skippedCount}`
  );
};

export const clearUsers = async (): Promise<void> => {
  Logger.info("Clearing all users...");

  const testEmails = TEST_USERS.map((u) => u.auth.email);

  const auths = await AuthModel.find({ email: { $in: testEmails } });
  const authIds = auths.map((a) => a._id);

  await UserModel.deleteMany({ authId: { $in: authIds } });
  await AuthModel.deleteMany({ email: { $in: testEmails } });

  Logger.info(`Cleared ${auths.length} test users`);
};
