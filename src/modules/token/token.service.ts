// types
import type { RefreshTokenDto } from "./dtos";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
import type {
  RefreshTokenPresentGuard,
  RefreshTokenValidGuard,
  AuthActiveGuard,
  PasswordNotChangedGuard,
  UserExistsGuard
} from "./guards";
// dtos
import { toRefreshTokenDto } from "./dtos";
// others
import { generateAuthTokensResponse } from "@/utils/token";
import { Logger } from "@/utils/logger";

export class TokenService {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly userService: UserService,
    private readonly refreshTokenPresentGuard: RefreshTokenPresentGuard,
    private readonly refreshTokenValidGuard: RefreshTokenValidGuard,
    private readonly authActiveGuard: AuthActiveGuard,
    private readonly passwordNotChangedGuard: PasswordNotChangedGuard,
    private readonly userExistsGuard: UserExistsGuard
  ) {}

  async refreshAccessToken(
    refreshToken: string | undefined,
    t: TranslateFunction
  ): Promise<RefreshTokenDto> {
    this.refreshTokenPresentGuard.assert(refreshToken, t);
    const payload = this.refreshTokenValidGuard.assert(refreshToken, t);

    const [auth, user] = await Promise.all([
      this.authService.findById(payload.authId),
      this.userService.findByAuthId(payload.authId)
    ]);

    this.authActiveGuard.assert(auth, payload.authId, t);
    this.passwordNotChangedGuard.assert(auth, payload, t);
    this.userExistsGuard.assert(user, payload.authId, t);

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
