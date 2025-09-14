import instanceRedis from '../databases/init.redis';

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

    return `${this.name}:${fields.join(':')}`;
  };

  private hGetAll = async (key: string): Promise<any> => {
    const obj = await this.redis.hGetAll(key);

    const cleanedObj = {};
    for (let key in obj) {
      let value = obj[key].replace(/^"(.*)"$/, '$1');

      // Convert string to number if possible
      if (!isNaN(value)) {
        cleanedObj[key] = Number(value);
      }
      // Convert 'true'/'false' to boolean
      else if (value === 'true' || value === 'false') {
        cleanedObj[key] = value === 'true';
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

class Repository extends Cache {
  private model: any;

  constructor(model: any, name: string, redis = '') {
    super(redis, name);
    this.model = model;
  }

  public create = async (object): Promise<any> => {
    return await this.model.create(object);
  };

  public insertMany = async (objects): Promise<any> => {
    return await this.model.insertMany(objects, {
      upsert: true,
      new: true
    });
  };

  public updateMany = async (filter, object) => {
    return await this.model.updateMany(
      { ...filter },
      { ...object },
      { new: true }
    );
  };

  public deleteMany = async (filter): Promise<any> => {
    return await this.model.deleteMany(filter);
  };

  public find = async (
    filter,
    skip: number = 0,
    limit: number = 0,
    saveCache = false
  ): Promise<any> => {
    const query = async () =>
      await this.model
        .find({ ...filter })
        .skip(skip)
        .limit(limit);

    if (saveCache) {
      return await this.findWithCache(
        { ...filter, limit, page: skip / limit + 1 },
        query
      );
    }

    return await query();
  };

  public findOne = async (filter, saveCache = false): Promise<any> => {
    const query = async () => await this.model.findOne({ ...filter });

    if (saveCache) await this.findOneInHsetWithCache({ ...filter }, query);

    return await query();
  };

  public findById = async (id, saveCache = false): Promise<any> => {
    const query = async () => await this.model.findById(id);
    if (saveCache) {
      return await this.findOneInHsetWithCache({ _id: id }, query);
    }
    return await query();
  };

  public findByIdAndUpdate = async (id, object): Promise<any> => {
    return await this.model.findByIdAndUpdate(id, { ...object }, { new: true });
  };

  public findOneAndUpdate = async (filter, object): Promise<any> => {
    return await this.model.findOneAndUpdate(
      { ...filter },
      { ...object },
      { new: true }
    );
  };

  public findByIdAndDelete = async (id): Promise<any> => {
    return await this.model.findByIdAndDelete(id);
  };

  public findOneAndDelete = async (filter): Promise<any> => {
    return await this.model.findOneAndDelete({ ...filter });
  };

  public countDocuments = async (filter): Promise<any> => {
    return await this.model.countDocuments({ ...filter });
  };
}

export default Repository;
