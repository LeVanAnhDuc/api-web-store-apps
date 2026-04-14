// types
import type { Job } from "bullmq";
import type { SendEmailService } from "@/services/email/email.service";
import type { EmailJobData } from "../queue.types";
// others
import { Logger } from "@/utils/logger";

export const createEmailProcessor =
  (emailService: SendEmailService) =>
  async (job: Job<EmailJobData>): Promise<void> => {
    const { type, email, data, locale } = job.data;

    Logger.debug(`Processing email job: ${job.name}`, {
      jobId: job.id,
      type,
      email
    });

    await emailService.executeSend(type, { email, data, locale });
  };
