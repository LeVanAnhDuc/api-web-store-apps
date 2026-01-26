/**
 * Check Email Service
 * Use Case: Check if email is available for registration
 *
 * Business Flow:
 * 1. Check if email exists in database
 * 2. Return availability status
 *
 * Purpose: UX enhancement for real-time email validation
 * Rate Limiting: Handled by middleware (per IP)
 */

import type {
  CheckEmailRequest,
  CheckEmailResponse
} from "@/modules/signup/types";

import { isEmailRegistered } from "@/modules/signup/repository";

import Logger from "@/infra/utils/logger";
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
