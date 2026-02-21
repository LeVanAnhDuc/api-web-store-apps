export type FilterCondition<T> = {
  [P in keyof T]?: T[P] | FilterOperators<T[P]>;
} & {
  $and?: FilterCondition<T>[];
  $or?: FilterCondition<T>[];
  $nor?: FilterCondition<T>[];
};

export type FilterOperators<T> = {
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $in?: T[];
  $nin?: T[];
  $exists?: boolean;
  $regex?: string | RegExp;
  $options?: string;
};

export type SortOrder<T> = {
  [P in keyof T]?: 1 | -1 | "asc" | "desc";
};

export interface QueryOptions<T> {
  skip?: number;
  limit?: number;
  sort?: SortOrder<T>;
  select?: (keyof T)[] | string;
  populate?: string | string[];
  lean?: boolean;
}

export type FindOneOptions<T> = Pick<
  QueryOptions<T>,
  "sort" | "populate" | "lean"
>;

export type FindByIdOptions<T> = Pick<QueryOptions<T>, "populate" | "lean">;

export type UpdateData<T> = {
  [P in keyof T]?: T[P];
} & {
  $set?: Partial<T>;
  $unset?: Partial<Record<keyof T, "" | 1>>;
  $inc?: Partial<Record<keyof T, number>>;
  $push?: Partial<T>;
  $pull?: Partial<T>;
  $addToSet?: Partial<T>;
};

export interface UpdateOptions {
  upsert?: boolean;
  multi?: boolean;
  new?: boolean;
  runValidators?: boolean;
}

export interface InsertOptions {
  ordered?: boolean;
  skipValidation?: boolean;
}

export interface DeleteResult {
  deletedCount: number;
}

export interface UpdateResult {
  matchedCount: number;
  modifiedCount: number;
  upsertedId?: string | number;
}

export interface TransactionContext {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

export interface IBaseRepository<T, ID = string> {
  create(data: Partial<T>): Promise<T>;
  insertMany(documents: Partial<T>[], options?: InsertOptions): Promise<T[]>;
  find(filter?: FilterCondition<T>, options?: QueryOptions<T>): Promise<T[]>;
  findOne(
    filter: FilterCondition<T>,
    options?: FindOneOptions<T>
  ): Promise<T | null>;
  findById(id: ID, options?: FindByIdOptions<T>): Promise<T | null>;
  findByIds(ids: ID[], options?: QueryOptions<T>): Promise<T[]>;
  findByIdAndUpdate(
    id: ID,
    update: UpdateData<T>,
    options?: UpdateOptions
  ): Promise<T | null>;
  findOneAndUpdate(
    filter: FilterCondition<T>,
    update: UpdateData<T>,
    options?: UpdateOptions
  ): Promise<T | null>;
  updateMany(
    filter: FilterCondition<T>,
    update: UpdateData<T>,
    options?: UpdateOptions
  ): Promise<UpdateResult>;
  findByIdAndDelete(id: ID): Promise<T | null>;
  findOneAndDelete(filter: FilterCondition<T>): Promise<T | null>;
  deleteMany(filter: FilterCondition<T>): Promise<DeleteResult>;
  countDocuments(filter?: FilterCondition<T>): Promise<number>;
  exists(filter: FilterCondition<T>): Promise<boolean>;
  aggregate<R = unknown>(pipeline: unknown[]): Promise<R[]>;
}
