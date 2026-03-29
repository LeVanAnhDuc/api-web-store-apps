// types
import type { LoginMethod } from "@/types/modules/login";
import type {
  LoginStatus,
  LoginFailReason,
  DeviceType,
  ClientType,
  LoginHistoryDocument
} from "@/types/modules/login-history";
// others
import { maskIp } from "../login-history.helper";

export interface MyHistoryItemDto {
  _id: string;
  method: LoginMethod;
  status: LoginStatus;
  failReason: LoginFailReason | null;
  ip: string;
  country: string;
  city: string;
  deviceType: DeviceType;
  os: string;
  browser: string;
  clientType: ClientType;
  createdAt: string;
}

export const toMyHistoryItemDto = (
  doc: LoginHistoryDocument
): MyHistoryItemDto => ({
  _id: doc._id.toString(),
  method: doc.method,
  status: doc.status,
  failReason: doc.failReason ?? null,
  ip: maskIp(doc.ip),
  country: doc.country,
  city: doc.city,
  deviceType: doc.deviceType,
  os: doc.os,
  browser: doc.browser,
  clientType: doc.clientType,
  createdAt: doc.createdAt.toISOString()
});
