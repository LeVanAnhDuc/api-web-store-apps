import type {
  CheckEmailRequest,
  CheckEmailResponse
} from "@/modules/signup/types";
import { isEmailRegistered } from "@/modules/signup/repository";
import { Logger } from "@/utils/logger";

export const checkEmailService = async (
  req: CheckEmailRequest
): Promise<Partial<ResponsePattern<CheckEmailResponse>>> => {
  const { email } = req.params;

  Logger.info("CheckEmail initiated", { email });

  const exists = await isEmailRegistered(email);

  Logger.info("CheckEmail completed", { email });

  return {
    data: {
      available: !exists
    }
  };
};
