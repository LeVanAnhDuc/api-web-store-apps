import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ConflictRequestError,
  MongoError,
  RedisError,
} from './error.response';
import { CreatedSuccess, OkSuccess, NoContentSuccess } from './success.response';

const responses = {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ConflictRequestError,
  MongoError,
  RedisError,
  CreatedSuccess,
  OkSuccess,
  NoContentSuccess,
};

export default responses;
