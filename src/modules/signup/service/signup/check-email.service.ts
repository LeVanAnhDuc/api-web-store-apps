import type {
  CheckEmailRequest,
  CheckEmailResponse
} from "@/modules/signup/types";
import { getAuthenticationRepository } from "@/repositories/authentication";
import { Logger } from "@/utils/logger";

export const checkEmailService = async (
  req: CheckEmailRequest
): Promise<Partial<ResponsePattern<CheckEmailResponse>>> => {
  const { email } = req.params;

  Logger.info("CheckEmail initiated", { email });

  const authRepo = getAuthenticationRepository();
  const exists = await authRepo.emailExists(email);

  Logger.info("CheckEmail completed", { email });

  return {
    data: {
      available: !exists
    }
  };
};
