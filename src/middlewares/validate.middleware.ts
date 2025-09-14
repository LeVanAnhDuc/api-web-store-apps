// libs
import joi from 'joi';
import { rateLimit } from 'express-rate-limit';
import { NextFunction, Request, Response } from 'express';
import lodash from 'lodash';
import { Model, Document, isValidObjectId, FilterQuery } from 'mongoose';
import {
  plainToClass,
  ClassConstructor,
  classToPlain
} from 'class-transformer';
import { validate } from 'class-validator';
// others
import { BadRequestError } from '../responses/error.response';

const TIME_RATE_LIMIT = 2 * 60 * 1000;
const REQUEST_RATE_LIMIT = 10;
const MESSAGE_RATE_LIMIT = 'Too many requests, please try again later.';

export const validateSchema = (schema: {
  body?: joi.ObjectSchema;
  query?: joi.ObjectSchema;
  params?: joi.ObjectSchema;
}) => {
  return (req: Request, _: Response, next: NextFunction) => {
    // All errors will be collected in one place : (abortEarly: false)

    try {
      const validateFields = ['body', 'query', 'params'];

      validateFields.forEach((field) => {
        if (schema[field]) {
          const { error, value } = schema[field].validate(req[field], {
            abortEarly: true
          });

          if (error) {
            throw new BadRequestError(error.details[0].message);
          }

          req[field] = value;
        }
      });

      next();
    } catch (err) {
      next(err);
    }
  };
};

export const rateLimitInstance = rateLimit({
  windowMs: TIME_RATE_LIMIT,
  max: REQUEST_RATE_LIMIT,
  message: MESSAGE_RATE_LIMIT,
  handler: (req, res, next, options) =>
    res.status(options.statusCode).send({
      status: 'Too Many Requests',
      code: options.statusCode,
      message: options.message
    })
});

export const requiredBody = (req: Request) => {
  if (lodash.isEmpty(req.body)) {
    throw new BadRequestError('data not empty');
  }

  return Promise.resolve();
};

export const isIDObject = (req: Request) => {
  const { id } = req.params;

  if (id && !isValidObjectId(id)) {
    throw new BadRequestError('id not valid');
  }

  return Promise.resolve();
};
