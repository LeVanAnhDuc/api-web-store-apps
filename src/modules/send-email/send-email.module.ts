import { NodemailerTransport } from "@/services/implements/NodemailerTransport";
import { SendEmailService } from "./send-email.service";

const emailTransport = NodemailerTransport.getInstance();
const sendEmailService = new SendEmailService(emailTransport);

export { sendEmailService };
export { EmailType } from "./send-email.types";
