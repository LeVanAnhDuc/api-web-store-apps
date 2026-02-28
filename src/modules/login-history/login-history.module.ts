import loginHistoryRepository from "@/repositories/login-history";
import { LoginHistoryService } from "./login-history.service";

const loginHistoryService = new LoginHistoryService(loginHistoryRepository);

export { loginHistoryService };
