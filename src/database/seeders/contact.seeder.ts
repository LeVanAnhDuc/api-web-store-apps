// models
import ContactModel from "@/models/contact";
// others
import { Logger } from "@/libs/logger";
import { TEST_CONTACTS } from "./data/contacts";

export const seedContacts = async (): Promise<void> => {
  Logger.info("Starting contact seeding...");

  let createdCount = 0;
  let skippedCount = 0;

  for (const testContact of TEST_CONTACTS) {
    const email = testContact.email ?? undefined;

    const existingContact = await ContactModel.findOne({
      subject: testContact.subject,
      email: email ?? null
    });

    if (existingContact) {
      Logger.warn(
        `Contact already exists: "${testContact.subject}", skipping...`
      );
      skippedCount++;
      continue;
    }

    await ContactModel.create({
      email,
      subject: testContact.subject,
      priority: testContact.priority,
      message: testContact.message,
      status: testContact.status
    });

    Logger.info(`Created contact: "${testContact.subject}"`);
    createdCount++;
  }

  Logger.info(
    `Contact seeding completed. Created: ${createdCount}, Skipped: ${skippedCount}`
  );
};

export const clearContacts = async (): Promise<void> => {
  Logger.info("Clearing seeded contacts...");

  const testSubjects = TEST_CONTACTS.map((c) => c.subject);

  const result = await ContactModel.deleteMany({
    subject: { $in: testSubjects }
  });

  Logger.info(`Cleared ${result.deletedCount} test contacts`);
};
