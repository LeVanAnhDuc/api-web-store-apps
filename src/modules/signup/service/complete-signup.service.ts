/**
 * Complete Signup Service
 * Use Case: User completes registration with profile data
 *
 * Business Flow:
 * 1. Verify session token is valid
 * 2. Ensure email is still not registered (double-check)
 * 3. Create auth record with hashed password
 * 4. Create user profile
 * 5. Issue authentication tokens
 * 6. Store refresh token
 * 7. Cleanup signup session data
 *
 * Idempotency: Session token is single-use (deleted after completion)
 */

// types
import type { TFunction } from "i18next";
import type { Schema } from "mongoose";
import type { Gender } from "@/shared/types/modules/user";
import type {
  CompleteSignupRequest,
  CompleteSignupResponse
} from "@/shared/types/modules/signup";

// errors
import { BadRequestError, ConflictRequestError } from "@/core/responses/error";

// repository
import {
  isEmailRegistered,
  createAuthRecord,
  createUserProfile,
  storeRefreshToken
} from "@/modules/signup/repository";

// store (Redis operations)
import {
  verifySession,
  cleanupSignupSession
} from "@/modules/signup/utils/store";

// helpers
import { hashPassword } from "@/core/helpers/bcrypt";
import { generatePairToken } from "@/core/helpers/jwt";

// constants
import { TOKEN_EXPIRY } from "@/core/configs/jwt";

// =============================================================================
// Business Rule Checks (Guard Functions)
// =============================================================================

/**
 * Verify session token is valid for email
 * @throws BadRequestError if session is invalid or expired
 */
const ensureSessionValid = async (
  email: string,
  sessionToken: string,
  t: TFunction
): Promise<void> => {
  const isValid = await verifySession(email, sessionToken);

  if (!isValid) {
    throw new BadRequestError(t("signup:errors.invalidSession"));
  }
};

/**
 * Ensure email is not already registered (double-check before creating)
 * @throws ConflictRequestError if email exists
 */
const ensureEmailNotRegistered = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const exists = await isEmailRegistered(email);

  if (exists) {
    throw new ConflictRequestError(t("signup:errors.emailAlreadyExists"));
  }
};

// =============================================================================
// Business Operations
// =============================================================================

interface CreateAccountResult {
  authId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  email: string;
  fullName: string;
}

/**
 * Create user account (Auth + User records)
 * Transaction-like operation: creates both records
 */
const createUserAccount = async (
  email: string,
  password: string,
  fullName: string,
  gender: Gender,
  dateOfBirth: string
): Promise<CreateAccountResult> => {
  // Hash password before storing
  const hashedPassword = hashPassword(password);

  // Create auth record first (contains email and password)
  const auth = await createAuthRecord({
    email,
    hashedPassword
  });

  // Create user profile linked to auth
  const user = await createUserProfile({
    authId: auth._id,
    fullName,
    gender,
    dateOfBirth: new Date(dateOfBirth)
  });

  return {
    authId: auth._id,
    userId: user._id,
    email: auth.email,
    fullName: user.fullName
  };
};

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Issue JWT token pair for authenticated user
 */
const issueAuthTokens = (
  userId: Schema.Types.ObjectId,
  authId: Schema.Types.ObjectId,
  email: string,
  roles: string
): TokenPair =>
  generatePairToken({
    userId: userId.toString(),
    authId: authId.toString(),
    email,
    roles
  });

/**
 * Persist refresh token to auth record
 */
const persistRefreshToken = async (
  authId: Schema.Types.ObjectId,
  refreshToken: string
): Promise<void> => {
  await storeRefreshToken(authId, refreshToken);
};

// =============================================================================
// Main Service
// =============================================================================

/**
 * Complete user signup with profile data
 *
 * @param req - Express request with CompleteSignupBody
 * @returns CompleteSignupResponse with user info and tokens
 *
 * @throws BadRequestError - Invalid session
 * @throws ConflictRequestError - Email already registered
 */
export const completeSignup = async (
  req: CompleteSignupRequest
): Promise<Partial<ResponsePattern<CompleteSignupResponse>>> => {
  const { email, password, fullName, gender, dateOfBirth, sessionToken } =
    req.body;
  const { t } = req;

  // Step 1: Verify session is valid
  await ensureSessionValid(email, sessionToken, t);

  // Step 2: Double-check email availability (race condition protection)
  await ensureEmailNotRegistered(email, t);

  // Step 3: Create user account (Auth + User)
  const account = await createUserAccount(
    email,
    password,
    fullName,
    gender,
    dateOfBirth
  );

  // Step 4: Issue authentication tokens
  const tokens = issueAuthTokens(
    account.userId,
    account.authId,
    account.email,
    "user" // Default role from AUTH_ROLES.USER
  );

  // Step 5: Store refresh token for session management
  await persistRefreshToken(account.authId, tokens.refreshToken);

  // Step 6: Cleanup all signup session data (OTP, session, etc.)
  await cleanupSignupSession(email);

  // Step 7: Build response
  return {
    message: t("signup:success.signupCompleted"),
    data: {
      success: true,
      user: {
        id: account.userId.toString(),
        email: account.email,
        fullName: account.fullName
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
      }
    }
  };
};
