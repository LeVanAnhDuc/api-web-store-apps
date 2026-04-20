// types
import type { Request } from "express";
import type { AuthenticationDocument } from "@/types/modules/authentication";
import type { UserDocument } from "@/types/modules/user";
import type { LoginMethod } from "@/types/modules/login";
import type { LoginResponseDto } from "../dtos";
import type { LoginAuditService } from "./login-audit.service";
// dtos
import { toLoginResponseDto } from "../dtos";
// others
import { generateAuthTokensResponse } from "@/utils/token";

export class LoginCompletionService {
  constructor(private readonly audit: LoginAuditService) {}

  complete(params: {
    auth: AuthenticationDocument;
    user: UserDocument;
    method: LoginMethod;
    req: Request;
  }): LoginResponseDto {
    const { auth, user, method, req } = params;

    this.audit.recordSuccess({ auth, user, method, req });

    return toLoginResponseDto(
      generateAuthTokensResponse({
        userId: user._id.toString(),
        authId: auth._id.toString(),
        email: user.email,
        roles: auth.roles,
        fullName: user.fullName,
        avatar: user.avatar ?? null
      })
    );
  }
}
