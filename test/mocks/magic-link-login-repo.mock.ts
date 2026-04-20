// types
import type { MagicLinkLoginRepository } from "@/modules/login/repositories/magic-link-login.repository";
// others
import { MAGIC_LINK_CONFIG } from "@/constants/modules/login";
import { SECONDS_PER_MINUTE } from "@/constants/time";

export function createMagicLinkLoginRepoMock(): jest.Mocked<MagicLinkLoginRepository> {
  return {
    MAGIC_LINK_EXPIRY_SECONDS:
      MAGIC_LINK_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE,
    MAGIC_LINK_COOLDOWN_SECONDS: MAGIC_LINK_CONFIG.COOLDOWN_SECONDS,
    createToken: jest.fn(),
    storeHashed: jest.fn(),
    verifyToken: jest.fn(),
    clearToken: jest.fn(),
    checkCooldown: jest.fn(),
    getCooldownRemaining: jest.fn(),
    setCooldown: jest.fn(),
    clearCooldown: jest.fn(),
    createAndStoreToken: jest.fn(),
    setCooldownAfterSend: jest.fn(),
    cleanupAll: jest.fn()
  } as unknown as jest.Mocked<MagicLinkLoginRepository>;
}
