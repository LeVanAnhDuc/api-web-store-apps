import type {
  FilterQuery,
  Model,
  PipelineStage,
  QueryOptions as MongooseQueryOptions,
  UpdateQuery
} from "mongoose";
import type {
  DeleteResult,
  FilterCondition,
  FindByIdOptions,
  FindOneOptions,
  InsertOptions,
  QueryOptions,
  UpdateData,
  UpdateOptions,
  UpdateResult
} from "../interfaces/base-repositorie.interface";
import BaseRepository from "../BaseRepository";

class MongoDBRepository<T, ID = string> extends BaseRepository<T, ID> {
  protected readonly model: Model<T>;

  constructor(model: Model<T>, name: string) {
    super(name);
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const document = await this.model.create(data);
      return document.toObject() as T;
    } catch (error) {
      throw this.handleError("create", error);
    }
  }

  async insertMany(
    documents: Partial<T>[],
    options?: InsertOptions
  ): Promise<T[]> {
    try {
      const mongoOptions = {
        ordered: options?.ordered ?? true
      };

      const result = await this.model.insertMany(documents, mongoOptions);
      return result.map((doc) => doc.toObject()) as T[];
    } catch (error) {
      throw this.handleError("insert many", error);
    }
  }

  async find(
    filter?: FilterCondition<T>,
    options?: QueryOptions<T>
  ): Promise<T[]> {
    try {
      const mongoFilter = this.convertFilter(filter);
      const query = this.model.find(mongoFilter);

      if (options?.skip) query.skip(options.skip);
      if (options?.limit) query.limit(options.limit);
      if (options?.sort) query.sort(options.sort as Record<string, 1 | -1>);
      if (options?.select) {
        if (Array.isArray(options.select)) {
          query.select(options.select.join(" "));
        } else {
          query.select(options.select);
        }
      }
      if (options?.populate) {
        const populateFields = Array.isArray(options.populate)
          ? options.populate
          : [options.populate];
        populateFields.forEach((field) => query.populate(field));
      }
      if (options?.lean) query.lean();

      return await query.exec();
    } catch (error) {
      throw this.handleError("find", error);
    }
  }

  async findOne(
    filter: FilterCondition<T>,
    options?: FindOneOptions<T>
  ): Promise<T | null> {
    try {
      const mongoFilter = this.convertFilter(filter);
      const query = this.model.findOne(mongoFilter);

      if (options?.sort) query.sort(options.sort as Record<string, 1 | -1>);
      if (options?.populate) {
        const populateFields = Array.isArray(options.populate)
          ? options.populate
          : [options.populate];
        populateFields.forEach((field) => query.populate(field));
      }
      if (options?.lean) query.lean();

      return await query.exec();
    } catch (error) {
      throw this.handleError("find one", error);
    }
  }

  async findById(id: ID, options?: FindByIdOptions<T>): Promise<T | null> {
    try {
      const query = this.model.findById(id as string);

      if (options?.populate) {
        const populateFields = Array.isArray(options.populate)
          ? options.populate
          : [options.populate];
        populateFields.forEach((field) => query.populate(field));
      }
      if (options?.lean) query.lean();

      return await query.exec();
    } catch (error) {
      throw this.handleError("find by id", error);
    }
  }

  async findByIds(ids: ID[], options?: QueryOptions<T>): Promise<T[]> {
    try {
      const filter = { _id: { $in: ids } } as FilterQuery<T>;
      const query = this.model.find(filter);

      if (options?.sort) query.sort(options.sort as Record<string, 1 | -1>);
      if (options?.select) {
        if (Array.isArray(options.select)) {
          query.select(options.select.join(" "));
        } else {
          query.select(options.select);
        }
      }
      if (options?.populate) {
        const populateFields = Array.isArray(options.populate)
          ? options.populate
          : [options.populate];
        populateFields.forEach((field) => query.populate(field));
      }
      if (options?.lean) query.lean();

      return await query.exec();
    } catch (error) {
      throw this.handleError("find by ids", error);
    }
  }

  async findByIdAndUpdate(
    id: ID,
    update: UpdateData<T>,
    options?: UpdateOptions
  ): Promise<T | null> {
    try {
      const mongoUpdate = this.convertUpdate(update);
      const mongoOptions = this.convertUpdateOptions(options);

      return await this.model
        .findByIdAndUpdate(id as string, mongoUpdate, mongoOptions)
        .exec();
    } catch (error) {
      throw this.handleError("find by id and update", error);
    }
  }

  async findOneAndUpdate(
    filter: FilterCondition<T>,
    update: UpdateData<T>,
    options?: UpdateOptions
  ): Promise<T | null> {
    try {
      const mongoFilter = this.convertFilter(filter);
      const mongoUpdate = this.convertUpdate(update);
      const mongoOptions = this.convertUpdateOptions(options);

      return await this.model
        .findOneAndUpdate(mongoFilter, mongoUpdate, mongoOptions)
        .exec();
    } catch (error) {
      throw this.handleError("find one and update", error);
    }
  }

  async updateMany(
    filter: FilterCondition<T>,
    update: UpdateData<T>,
    options?: UpdateOptions
  ): Promise<UpdateResult> {
    try {
      const mongoFilter = this.convertFilter(filter);
      const mongoUpdate = this.convertUpdate(update);
      const mongoOptions = {
        upsert: options?.upsert ?? false,
        runValidators: options?.runValidators ?? false
      };

      const result = await this.model.updateMany(
        mongoFilter,
        mongoUpdate,
        mongoOptions
      );

      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId ? String(result.upsertedId) : undefined
      };
    } catch (error) {
      throw this.handleError("update many", error);
    }
  }

  async findByIdAndDelete(id: ID): Promise<T | null> {
    try {
      return await this.model.findByIdAndDelete(id as string).exec();
    } catch (error) {
      throw this.handleError("find by id and delete", error);
    }
  }

  async findOneAndDelete(filter: FilterCondition<T>): Promise<T | null> {
    try {
      const mongoFilter = this.convertFilter(filter);
      return await this.model.findOneAndDelete(mongoFilter).exec();
    } catch (error) {
      throw this.handleError("find one and delete", error);
    }
  }

  async deleteMany(filter: FilterCondition<T>): Promise<DeleteResult> {
    try {
      const mongoFilter = this.convertFilter(filter);
      const result = await this.model.deleteMany(mongoFilter);
      return { deletedCount: result.deletedCount };
    } catch (error) {
      throw this.handleError("delete many", error);
    }
  }

  async countDocuments(filter?: FilterCondition<T>): Promise<number> {
    try {
      if (!filter || Object.keys(filter).length === 0) {
        return await this.model.estimatedDocumentCount().exec();
      }

      const mongoFilter = this.convertFilter(filter);
      return await this.model.countDocuments(mongoFilter).exec();
    } catch (error) {
      throw this.handleError("count documents", error);
    }
  }

  async exists(filter: FilterCondition<T>): Promise<boolean> {
    try {
      const mongoFilter = this.convertFilter(filter);
      const result = await this.model.exists(mongoFilter);
      return result !== null;
    } catch (error) {
      throw this.handleError("exists", error);
    }
  }

  async aggregate<R = unknown>(pipeline: PipelineStage[]): Promise<R[]> {
    try {
      return await this.model.aggregate<R>(pipeline).exec();
    } catch (error) {
      throw this.handleError("aggregate", error);
    }
  }

  protected convertFilter(filter?: FilterCondition<T>): FilterQuery<T> {
    if (!filter) return {} as FilterQuery<T>;
    return filter as FilterQuery<T>;
  }

  protected convertUpdate(update: UpdateData<T>): UpdateQuery<T> {
    return update as UpdateQuery<T>;
  }

  protected convertUpdateOptions(
    options?: UpdateOptions
  ): MongooseQueryOptions {
    if (!options) return { new: true };

    return {
      new: options.new ?? true,
      upsert: options.upsert ?? false,
      runValidators: options.runValidators ?? false
    };
  }
}

export default MongoDBRepository;
