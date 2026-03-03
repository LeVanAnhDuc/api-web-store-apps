import { LoginHistoryRepository } from "@/repositories/login-history.repository";
import { LoginHistoryService } from "./login-history.service";

export const createLoginHistoryModule = () => {
  const loginHistoryRepo = new LoginHistoryRepository();
  const loginHistoryService = new LoginHistoryService(loginHistoryRepo);

  return { loginHistoryService };
};
