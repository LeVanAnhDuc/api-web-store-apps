// libs
import * as bcrypt from "bcrypt";
// constants
import { BCRYPT } from "@/core/configs/security";

export const hashPassword = (password: string) =>
  bcrypt.hashSync(password, BCRYPT.SALT_ROUNDS);

export const isValidPassword = (password: string, hash: string) =>
  bcrypt.compareSync(password, hash);
