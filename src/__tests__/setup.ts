// Global test setup

// Mock Redis database
jest.mock("@/database/redis/redis.database", () => ({
  default: {
    getClient: jest.fn()
  },
  __esModule: true
}));

// Mock Logger
jest.mock("@/core/utils/logger", () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock i18next
jest.mock("@/i18n", () => ({
  default: {
    t: jest.fn((key: string) => key),
    getFixedT: jest.fn(() => (key: string) => key)
  },
  __esModule: true
}));

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
