// types
import type { RefreshTokenDto } from "./dtos";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
// config
import { UnauthorizedError, ForbiddenError } from "@/config/responses/error";
// dtos
import { toRefreshTokenDto } from "./dtos";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { generateAuthTokensResponse, verifyRefreshToken } from "@/utils/token";
import { Logger } from "@/utils/logger";

export class TokenService {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly userService: UserService
  ) {}

  async refreshAccessToken(
    refreshToken: string | undefined,
    t: TranslateFunction
  ): Promise<RefreshTokenDto> {
    if (!refreshToken) {
      Logger.warn("Token refresh failed - no refresh token in cookie");
      throw new UnauthorizedError(
        t("login:errors.refreshTokenRequired"),
        ERROR_CODES.REFRESH_TOKEN_REQUIRED
      );
    }

    let payload: RefreshTokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      Logger.warn("Token refresh failed - invalid refresh token", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw new ForbiddenError(
        t("login:errors.invalidRefreshToken"),
        ERROR_CODES.REFRESH_TOKEN_INVALID
      );
    }

    const [auth, user] = await Promise.all([
      this.authService.findById(payload.authId),
      this.userService.findByAuthId(payload.authId)
    ]);

    if (!auth || !auth.isActive) {
      Logger.warn("Token refresh rejected - account missing or inactive", {
        authId: payload.authId
      });
      throw new ForbiddenError(
        t("login:errors.invalidRefreshToken"),
        ERROR_CODES.REFRESH_TOKEN_INVALID
      );
    }

    if (
      auth.passwordChangedAt &&
      payload.iat &&
      payload.iat < Math.floor(auth.passwordChangedAt.getTime() / 1000)
    ) {
      Logger.warn(
        "Token refresh rejected - password changed after token issued",
        {
          authId: payload.authId
        }
      );
      throw new ForbiddenError(
        t("forgotPassword:errors.passwordChangedPleaseLogin"),
        ERROR_CODES.AUTH_PASSWORD_CHANGED
      );
    }

    if (!user) {
      Logger.warn("Token refresh rejected - user profile not found", {
        authId: payload.authId
      });
      throw new ForbiddenError(
        t("login:errors.invalidRefreshToken"),
        ERROR_CODES.REFRESH_TOKEN_INVALID
      );
    }

    const authTokensResponse = generateAuthTokensResponse({
      userId: user._id.toString(),
      authId: auth._id.toString(),
      email: user.email,
      roles: auth.roles,
      fullName: user.fullName,
      avatar: user.avatar ?? null
    });

    Logger.info("Token refresh successful", { userId: user._id.toString() });

    return toRefreshTokenDto(authTokensResponse);
  }
}
