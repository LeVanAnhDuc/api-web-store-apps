// libs
import {
  Document,
  FilterQuery,
  InsertManyOptions,
  Model,
  MongooseUpdateQueryOptions,
  QueryOptions,
  UpdateQuery
} from "mongoose";
import instanceRedis from "../databases/init.redis";

class Cache {
  private redis: any;
  private name: string;
  private expireTimeInSecondsRedis: number;

  constructor(redis: any, name: string) {
    this.redis = redis;
    this.name = name;
    this.expireTimeInSecondsRedis = Math.floor(Math.random() * 3600) + 3600;
  }

  private key = (filter: { [key: string]: any }): string => {
    const filterKey = Object.keys(filter).sort();
    const fields = filterKey.map((key) => {
      return `${key}:${filter[key].toString()}`;
    });

    return `${this.name}:${fields.join(":")}`;
  };

  private hGetAll = async (key: string): Promise<any> => {
    const obj = await this.redis.hGetAll(key);

    const cleanedObj = {};
    for (let key in obj) {
      let value = obj[key].replace(/^"(.*)"$/, "$1");

      // Convert string to number if possible
      if (!isNaN(value)) {
        cleanedObj[key] = Number(value);
      }
      // Convert 'true'/'false' to boolean
      else if (value === "true" || value === "false") {
        cleanedObj[key] = value === "true";
      }
      // Otherwise, keep the value as is
      else {
        cleanedObj[key] = value;
      }
    }

    return JSON.parse(JSON.stringify(cleanedObj));
  };

  private hGet = async (key: string, field: string): Promise<any> => {
    const value = await this.redis.hGet(key, field);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  private hSet = async (
    key: string,
    field: string,
    value: any
  ): Promise<void> => {
    await this.redis.hSet(key, field, JSON.stringify(value));
    await this.redis.expire(key, this.expireTimeInSecondsRedis);
  };

  private get = async (key: string): Promise<any> => {
    const value = await this.redis.get(key);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  public set = async (
    key: string,
    value: any,
    redisOptions: any = undefined
  ): Promise<void> => {
    await this.redis.set(key, JSON.stringify(value), redisOptions);
    await this.redis.expire(key, this.expireTimeInSecondsRedis);
  };

  public findWithCache = async (
    filter: any,
    query: any,
    redisOptions: any = undefined
  ): Promise<any> => {
    const key = this.key(filter);

    let item = await this.get(key);

    if (!item && query) {
      item = await query();
      if (item) {
        await this.set(key, item, redisOptions);
      }
    }
    return item;
  };

  public findOneInHsetWithCache = async (
    filter: any,
    query: any
  ): Promise<any> => {
    const key = this.key(filter);

    let item = await this.hGetAll(key);
    if (Object.keys(item).length === 0 && query) {
      item = await query();

      Object.entries(item._doc).map(
        async (value) => await this.hSet(key, value[0].toString(), value[1])
      );
    }

    return item;
  };

  public SetHsetWithCache = async (
    filter: Record<string, any>,
    object: Record<string, any>
  ): Promise<any> => {
    const key = this.key(filter);

    let item = await this.hGetAll(key);
    if (Object.keys(item).length === 0) {
      item = Object.entries(object).map(
        async (value) => await this.hSet(key, value[0].toString(), value[1])
      );
    }

    return item;
  };
}

class Repository<T extends Pick<Document, "_id">> extends Cache {
  private model: Model<T>;

  constructor(model: Model<T>, name: string, redis = "") {
    super(redis, name);
    this.model = model;
  }

  public async create(object: Partial<T>): Promise<T> {
    try {
      return await this.model.create(object);
    } catch (error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  public async insertMany(
    objects: Partial<T>[],
    options: InsertManyOptions = {}
  ): Promise<T[]> {
    try {
      const result = await this.model.insertMany(objects, options);

      return result.map((doc) => doc.toObject()) as T[];
    } catch (error) {
      throw new Error(`Failed to insert documents: ${error.message}`);
    }
  }

  public async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: MongooseUpdateQueryOptions<T> = {}
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    try {
      return await this.model.updateMany(filter, update, options);
    } catch (error) {
      throw new Error(`Failed to update documents: ${error.message}`);
    }
  }

  public async deleteMany(
    filter: FilterQuery<T>
  ): Promise<{ deletedCount: number }> {
    try {
      return await this.model.deleteMany(filter);
    } catch (error) {
      throw new Error(`Failed to delete documents: ${error.message}`);
    }
  }

  public async find(
    filter: FilterQuery<T>,
    skip: number = 0,
    limit: number = 0,
    options: QueryOptions = {},
    saveCache = false
  ): Promise<T[]> {
    try {
      const query = this.model
        .find(filter, null, options)
        .skip(skip)
        .limit(limit);

      if (saveCache) {
        return await this.findWithCache(
          { filter, limit, page: skip / limit + 1 },
          async () => await query.exec()
        );
      }
      return await query.exec();
    } catch (error) {
      throw new Error(`Failed to find documents: ${error.message}`);
    }
  }

  public async findOne(
    filter: FilterQuery<T>,
    options: QueryOptions = {},
    saveCache = false
  ): Promise<T | null> {
    try {
      const query = this.model.findOne(filter, null, options);

      if (saveCache) {
        await this.findOneInHsetWithCache(
          filter,
          async () => await query.exec()
        );
      }

      return await query.exec();
    } catch (error) {
      throw new Error(`Failed to find document: ${error.message}`);
    }
  }

  public async findById(
    id: string,
    options: QueryOptions = {},
    saveCache = false
  ): Promise<T | null> {
    try {
      const query = this.model.findById(id, null, options);

      if (saveCache) {
        return await this.findOneInHsetWithCache(
          { _id: id },
          async () => await query.exec()
        );
      }

      return await query.exec();
    } catch (error) {
      throw new Error(`Failed to find document by ID: ${error.message}`);
    }
  }

  public async findByIdAndUpdate(
    id: string,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true }
  ): Promise<T | null> {
    try {
      return await this.model.findByIdAndUpdate(id, update, options).exec();
    } catch (error) {
      throw new Error(`Failed to update document by ID: ${error.message}`);
    }
  }

  public async findOneAndUpdate(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true }
  ): Promise<T | null> {
    try {
      return await this.model.findOneAndUpdate(filter, update, options).exec();
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  public async findByIdAndDelete(id: string): Promise<T | null> {
    try {
      return await this.model.findByIdAndDelete(id).exec();
    } catch (error) {
      throw new Error(`Failed to delete document by ID: ${error.message}`);
    }
  }

  public async findOneAndDelete(filter: FilterQuery<T>): Promise<T | null> {
    try {
      return await this.model.findOneAndDelete(filter).exec();
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  public async countDocuments(filter: FilterQuery<T>): Promise<number> {
    try {
      return await this.model.countDocuments(filter).exec();
    } catch (error) {
      throw new Error(`Failed to count documents: ${error.message}`);
    }
  }
}

export default Repository;
