import type {
  DeleteResult,
  FilterCondition,
  FindByIdOptions,
  FindOneOptions,
  IBaseRepository,
  InsertOptions,
  QueryOptions,
  UpdateData,
  UpdateOptions,
  UpdateResult
} from "./interfaces/base-repositorie.interface";

abstract class BaseRepository<T, ID = string>
  implements IBaseRepository<T, ID>
{
  protected readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  protected handleError(operation: string, error: unknown): Error {
    const message = error instanceof Error ? error.message : String(error);
    return new Error(`Repository ${operation} failed: ${message}`);
  }

  abstract create(data: Partial<T>): Promise<T>;
  abstract insertMany(
    documents: Partial<T>[],
    options?: InsertOptions
  ): Promise<T[]>;
  abstract find(
    filter?: FilterCondition<T>,
    options?: QueryOptions<T>
  ): Promise<T[]>;
  abstract findOne(
    filter: FilterCondition<T>,
    options?: FindOneOptions<T>
  ): Promise<T | null>;
  abstract findById(id: ID, options?: FindByIdOptions<T>): Promise<T | null>;
  abstract findByIds(ids: ID[], options?: QueryOptions<T>): Promise<T[]>;
  abstract findByIdAndUpdate(
    id: ID,
    update: UpdateData<T>,
    options?: UpdateOptions
  ): Promise<T | null>;
  abstract findOneAndUpdate(
    filter: FilterCondition<T>,
    update: UpdateData<T>,
    options?: UpdateOptions
  ): Promise<T | null>;
  abstract updateMany(
    filter: FilterCondition<T>,
    update: UpdateData<T>,
    options?: UpdateOptions
  ): Promise<UpdateResult>;
  abstract findByIdAndDelete(id: ID): Promise<T | null>;
  abstract findOneAndDelete(filter: FilterCondition<T>): Promise<T | null>;
  abstract deleteMany(filter: FilterCondition<T>): Promise<DeleteResult>;
  abstract countDocuments(filter?: FilterCondition<T>): Promise<number>;
  abstract exists(filter: FilterCondition<T>): Promise<boolean>;
  abstract aggregate<R = unknown>(pipeline: unknown[]): Promise<R[]>;
}

export default BaseRepository;
