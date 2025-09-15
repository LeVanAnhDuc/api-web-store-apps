import express from "express";
// import routerToDo from "./todo.router";
import authRouter from "../modules/auth";

const router = express.Router();

router.use("/auth", authRouter);
// router.use('/todos', routerToDo);

export default router;
