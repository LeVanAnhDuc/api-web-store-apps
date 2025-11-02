// libs
import { Router } from "express";
// routes
import authRoutes from "./auth.routes";
// TODO: Uncomment when user module is implemented
// import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
// TODO: Uncomment when user module is implemented
// router.use("/users", userRoutes);

export default router;
