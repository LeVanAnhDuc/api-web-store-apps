import express from "express";
import TodoController from "../controllers/todo.controller";
import { isIDObject, requiredBody } from "../middlewares/validate.middleware";
import { authorMiddleware } from "../middlewares/auth.middleware";

import { asyncHandler, asyncMiddlewareHandler } from "../helper";

const router = express.Router();

router.get(
  "/",
  // asyncMiddlewareHandler(validateFieldsRequestQuery(GetTodosQueryParamsDTO)),
  asyncHandler(TodoController.getTodosController)
);

router.get(
  "/:id",
  asyncMiddlewareHandler(isIDObject),
  asyncHandler(TodoController.getTodoByIDController)
);

router.use(asyncMiddlewareHandler(authorMiddleware));

router.post(
  "/",
  asyncMiddlewareHandler(requiredBody),
  // asyncMiddlewareHandler(validateFieldsRequestBody(CreateTodoDTO)),
  asyncHandler(TodoController.addTodoController)
);

router.put(
  "/:id",
  asyncMiddlewareHandler(isIDObject),
  asyncMiddlewareHandler(requiredBody),
  // asyncMiddlewareHandler(validateFieldsRequestBody(UpdateTodoDTO)),
  asyncHandler(TodoController.updateTodoController)
);

router.delete(
  "/:id",
  asyncMiddlewareHandler(isIDObject),
  asyncHandler(TodoController.deleteTodoController)
);

export default router;
