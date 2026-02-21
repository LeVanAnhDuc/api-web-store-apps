import type { LoginHistoryDocument } from "../login-history/types";
import LoginHistoryModel from "../login-history/model";
import type { CreateLoginHistoryInput } from "./types";

export const createLoginHistory = async (
  data: CreateLoginHistoryInput
): Promise<LoginHistoryDocument> => LoginHistoryModel.create(data);
