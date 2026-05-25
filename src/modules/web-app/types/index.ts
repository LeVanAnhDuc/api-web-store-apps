// types
import type { Schema } from "mongoose";
import type { AuthenticationRole } from "@/modules/authentication/types";
import type {
  WEB_APP_STATUSES,
  TOKEN_ENDPOINT_AUTH_METHODS
} from "@/modules/web-app/constants";

export type WebAppStatus =
  (typeof WEB_APP_STATUSES)[keyof typeof WEB_APP_STATUSES];

export type TokenEndpointAuthMethod =
  (typeof TOKEN_ENDPOINT_AUTH_METHODS)[keyof typeof TOKEN_ENDPOINT_AUTH_METHODS];

export interface WebAppDocument {
  _id: Schema.Types.ObjectId;
  categoryId: Schema.Types.ObjectId;
  name: string;
  displayName: string;
  description: string | null;
  iconUrl: string | null;
  homeUrl: string;
  clientId: string;
  clientSecretHash: string | null;
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  backchannelLogoutUri: string | null;
  grantTypes: string[];
  responseTypes: string[];
  scopes: string[];
  tokenEndpointAuthMethod: TokenEndpointAuthMethod;
  requiredRoles: AuthenticationRole[];
  status: WebAppStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebAppCategoryDocument {
  _id: Schema.Types.ObjectId;
  name: string;
  displayName: string;
  icon: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
