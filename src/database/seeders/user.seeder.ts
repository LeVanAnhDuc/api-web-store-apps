import AuthenticationModel from "@/models/authentication";
import UserModel from "@/models/user";
import { hashValue } from "@/utils/crypto/bcrypt";
import { TEST_USERS } from "./data/users";
import { Logger } from "@/utils/logger";

export const seedUsers = async (): Promise<void> => {
  Logger.info("Starting user seeding...");

  let createdCount = 0;
  let skippedCount = 0;

  for (const testUser of TEST_USERS) {
    const existingAuthentication = await AuthenticationModel.findOne({
      email: testUser.authentication.email
    });

    if (existingAuthentication) {
      Logger.warn(
        `User already exists: ${testUser.authentication.email}, skipping...`
      );
      skippedCount++;
      continue;
    }

    const hashedPassword = hashValue(testUser.authentication.password);

    const authentication = await AuthenticationModel.create({
      email: testUser.authentication.email,
      password: hashedPassword,
      roles: testUser.authentication.roles,
      verifiedEmail: testUser.authentication.verifiedEmail,
      isActive: testUser.authentication.isActive
    });

    await UserModel.create({
      authId: authentication._id,
      fullName: testUser.user.fullName,
      gender: testUser.user.gender,
      dateOfBirth: testUser.user.dateOfBirth
    });

    Logger.info(`Created user: ${testUser.authentication.email}`);
    createdCount++;
  }

  Logger.info(
    `User seeding completed. Created: ${createdCount}, Skipped: ${skippedCount}`
  );
};

export const clearUsers = async (): Promise<void> => {
  Logger.info("Clearing all users...");

  const testEmails = TEST_USERS.map((u) => u.authentication.email);

  const authentications = await AuthenticationModel.find({
    email: { $in: testEmails }
  });
  const authIds = authentications.map((a) => a._id);

  await UserModel.deleteMany({ authId: { $in: authIds } });
  await AuthenticationModel.deleteMany({ email: { $in: testEmails } });

  Logger.info(`Cleared ${authentications.length} test users`);
};
