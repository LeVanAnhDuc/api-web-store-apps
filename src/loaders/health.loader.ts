// libs
import { Router } from "express";
// types
import type { Express, Request, Response } from "express";
// config
import { InternalServerError } from "@/config/responses/error";
import { OkSuccess } from "@/config/responses/success";
// database
import { instanceMongoDB } from "@/database/mongodb";
import { instanceRedis } from "@/database/redis";
// others
import { asyncHandler } from "@/utils/async-handler";

const checkMongoDB = asyncHandler(async (req: Request, res: Response) => {
  const isHealthy = instanceMongoDB.isHealthy();

  if (!isHealthy) {
    throw new InternalServerError("MongoDB is down", "MONGODB_UNHEALTHY");
  }

  new OkSuccess({
    message: "MongoDB is healthy",
    data: { mongodb: { status: "up" } }
  }).send(req, res);
});

const checkRedis = asyncHandler(async (req: Request, res: Response) => {
  const redisHealth = await instanceRedis.healthCheck();

  if (!redisHealth.isHealthy) {
    throw new InternalServerError("Redis is down", "REDIS_UNHEALTHY");
  }

  new OkSuccess({
    message: "Redis is healthy",
    data: {
      redis: { status: "up", latency_ms: redisHealth.latency ?? null }
    }
  }).send(req, res);
});

const checkAll = asyncHandler(async (req: Request, res: Response) => {
  const mongoHealthy = instanceMongoDB.isHealthy();
  const redisHealth = await instanceRedis.healthCheck();
  const allHealthy = mongoHealthy && redisHealth.isHealthy;

  if (!allHealthy) {
    const down = [
      !mongoHealthy && "MongoDB",
      !redisHealth.isHealthy && "Redis"
    ].filter(Boolean);

    throw new InternalServerError(
      `Services down: ${down.join(", ")}`,
      "SERVICES_UNHEALTHY"
    );
  }

  new OkSuccess({
    message: "All services are healthy",
    data: {
      mongodb: { status: "up" },
      redis: { status: "up", latency_ms: redisHealth.latency ?? null }
    }
  }).send(req, res);
});

export const loadHealthCheck = (app: Express): void => {
  const healthRouter = Router();

  healthRouter.get("/mongodb", checkMongoDB);
  healthRouter.get("/redis", checkRedis);
  healthRouter.get("/all", checkAll);

  app.use("/health", healthRouter);
};
