// libs
import type {
  FilterQuery,
  InsertManyOptions,
  Model,
  MongooseUpdateQueryOptions,
  QueryOptions,
  UpdateQuery
} from "mongoose";

/**
 * Cache layer for repository operations
 * Currently inactive - will be enabled when Redis is integrated
 */
class CacheLayer {
  protected readonly name: string;
  protected readonly cacheEnabled: boolean = false;
  // TODO: Uncomment when integrating Redis
  // private redis: RedisClientType;
  // private readonly expireTimeInSeconds: number;

  constructor(name: string) {
    this.name = name;
    // TODO: Uncomment when integrating Redis
    // this.redis = redisClient;
    // this.expireTimeInSeconds = Math.floor(Math.random() * 3600) + 3600;
  }

  /**
   * Generate cache key from filter object
   */
  protected generateCacheKey(filter: Record<string, unknown>): string {
    const sortedKeys = Object.keys(filter).sort();
    const keyParts = sortedKeys.map((key) => `${key}:${String(filter[key])}`);
    return `${this.name}:${keyParts.join(":")}`;
  }

  /**
   * Get value from cache
   * Currently returns null - will be implemented with Redis
   */
  protected async getFromCache<T>(_key: string): Promise<T | null> {
    if (!this.cacheEnabled) return null;

    // TODO: Implement Redis get
    // try {
    //   const value = await this.redis.get(_key);
    //   return value ? JSON.parse(value) : null;
    // } catch (error) {
    //   Logger.warn('Cache get failed', { key: _key, error });
    //   return null;
    // }

    return null;
  }

  /**
   * Set value to cache
   * Currently no-op - will be implemented with Redis
   */
  protected async setToCache<T>(_key: string, _value: T): Promise<void> {
    if (!this.cacheEnabled) return;

    // TODO: Implement Redis set
    // try {
    //   await this.redis.set(
    //     _key,
    //     JSON.stringify(_value),
    //     { EX: this.expireTimeInSeconds }
    //   );
    // } catch (error) {
    //   Logger.warn('Cache set failed', { key: _key, error });
    // }
  }

  /**
   * Delete value from cache
   * Currently no-op - will be implemented with Redis
   */
  protected async deleteFromCache(_key: string): Promise<void> {
    if (!this.cacheEnabled) return;

    // TODO: Implement Redis delete
    // try {
    //   await this.redis.del(_key);
    // } catch (error) {
    //   Logger.warn('Cache delete failed', { key: _key, error });
    // }
  }

  /**
   * Clear all cache for this repository
   * Currently no-op - will be implemented with Redis
   */
  protected async clearCache(): Promise<void> {
    if (!this.cacheEnabled) return;

    // TODO: Implement cache clear by pattern
    // try {
    //   const pattern = `${this.name}:*`;
    //   const keys = await this.redis.keys(pattern);
    //   if (keys.length > 0) {
    //     await this.redis.del(keys);
    //   }
    // } catch (error) {
    //   Logger.warn('Cache clear failed', { error });
    // }
  }
}

class Repository<T> extends CacheLayer {
  protected readonly model: Model<T>;

  constructor(model: Model<T>, name: string) {
    super(name);
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const document = await this.model.create(data);
      await this.clearCache();
      return document;
    } catch (error) {
      throw this.handleError("create", error);
    }
  }

  async insertMany(
    documents: Partial<T>[],
    options: InsertManyOptions = {}
  ): Promise<T[]> {
    try {
      const result = await this.model.insertMany(documents, options);
      await this.clearCache();
      return result.map((doc) => doc.toObject()) as T[];
    } catch (error) {
      throw this.handleError("insert many", error);
    }
  }

  async find(
    filter: FilterQuery<T> = {},
    options: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
      select?: string | Record<string, 1 | 0>;
    } = {}
  ): Promise<T[]> {
    try {
      const { skip = 0, limit = 0, sort, select } = options;

      const query = this.model.find(filter);

      if (skip > 0) query.skip(skip);
      if (limit > 0) query.limit(limit);
      if (sort) query.sort(sort);
      if (select) query.select(select);

      return await query.exec();
    } catch (error) {
      throw this.handleError("find", error);
    }
  }

  async findOne(
    filter: FilterQuery<T>,
    options: QueryOptions = {}
  ): Promise<T | null> {
    try {
      return await this.model.findOne(filter, null, options).exec();
    } catch (error) {
      throw this.handleError("find one", error);
    }
  }

  async findById(id: string, options: QueryOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.generateCacheKey({ _id: id });
      const cached = await this.getFromCache<T>(cacheKey);
      if (cached) return cached;

      const document = await this.model.findById(id, null, options).exec();
      if (document) {
        await this.setToCache(cacheKey, document);
      }

      return document;
    } catch (error) {
      throw this.handleError("find by id", error);
    }
  }

  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: MongooseUpdateQueryOptions<T> = {}
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    try {
      const result = await this.model.updateMany(filter, update, options);
      await this.clearCache();
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      throw this.handleError("update many", error);
    }
  }

  async findByIdAndUpdate(
    id: string,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true }
  ): Promise<T | null> {
    try {
      const document = await this.model
        .findByIdAndUpdate(id, update, options)
        .exec();

      if (document) {
        const cacheKey = this.generateCacheKey({ _id: id });
        await this.deleteFromCache(cacheKey);
      }

      return document;
    } catch (error) {
      throw this.handleError("update by id", error);
    }
  }

  async findOneAndUpdate(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true }
  ): Promise<T | null> {
    try {
      const document = await this.model
        .findOneAndUpdate(filter, update, options)
        .exec();

      await this.clearCache();
      return document;
    } catch (error) {
      throw this.handleError("update one", error);
    }
  }

  async deleteMany(filter: FilterQuery<T>): Promise<{ deletedCount: number }> {
    try {
      const result = await this.model.deleteMany(filter);
      await this.clearCache();
      return { deletedCount: result.deletedCount };
    } catch (error) {
      throw this.handleError("delete many", error);
    }
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    try {
      const document = await this.model.findByIdAndDelete(id).exec();

      if (document) {
        const cacheKey = this.generateCacheKey({ _id: id });
        await this.deleteFromCache(cacheKey);
      }

      return document;
    } catch (error) {
      throw this.handleError("delete by id", error);
    }
  }

  async findOneAndDelete(filter: FilterQuery<T>): Promise<T | null> {
    try {
      const document = await this.model.findOneAndDelete(filter).exec();
      await this.clearCache();
      return document;
    } catch (error) {
      throw this.handleError("delete one", error);
    }
  }

  async countDocuments(filter: FilterQuery<T> = {}): Promise<number> {
    try {
      return await this.model.countDocuments(filter).exec();
    } catch (error) {
      throw this.handleError("count", error);
    }
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      const result = await this.model.exists(filter);
      return result !== null;
    } catch (error) {
      throw this.handleError("exists", error);
    }
  }

  private handleError(operation: string, error: unknown): Error {
    const message = error instanceof Error ? error.message : String(error);
    return new Error(`Repository ${operation} failed: ${message}`);
  }
}

export default Repository;
