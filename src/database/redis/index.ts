// Main exports
export { default } from "./redis.database";
export { default as instanceRedis } from "./redis.database";

// Config exports
export { REDIS_CONNECT_TIMEOUT, buildRedisConfig } from "./redis.config";

// Event handlers export
export { setupEventHandlers } from "./redis.events";

// Health check exports
export { checkRedisHealth, type RedisHealthStatus } from "./redis.health";
