// core
import { NodemailerTransport } from "@/services/cores/NodemailerTransport";
// others
import { SendEmailService } from "./email.service";

export const createEmailModule = () => {
  const transport = NodemailerTransport.getInstance();
  const emailService = new SendEmailService(transport);

  return { emailService };
};

export { EmailType } from "./email.types";
