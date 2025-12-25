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

// types
import type {
  CheckEmailRequest,
  CheckEmailResponse
} from "@/shared/types/modules/signup";

// repository
import { isEmailRegistered } from "@/modules/signup/repository";

// =============================================================================
// Main Service
// =============================================================================

/**
 * Check if email is available for registration
 *
 * @param req - Express request with email param
 * @returns CheckEmailResponse with availability status
 */
export const checkEmail = async (
  req: CheckEmailRequest
): Promise<Partial<ResponsePattern<CheckEmailResponse>>> => {
  const { email } = req.params;

  // Simple check: is email registered?
  const exists = await isEmailRegistered(email);

  return {
    data: {
      available: !exists
    }
  };
};
