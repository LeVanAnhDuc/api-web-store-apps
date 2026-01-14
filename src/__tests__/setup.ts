jest.mock("@/database/redis/redis.database", () => ({
  default: {
    getClient: jest.fn()
  },
  __esModule: true
}));

jest.mock("@/infra/utils/logger", () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock("@/i18n", () => ({
  default: {
    t: jest.fn((key: string) => key),
    getFixedT: jest.fn(() => (key: string) => key)
  },
  __esModule: true
}));

afterEach(() => {
  jest.clearAllMocks();
});
