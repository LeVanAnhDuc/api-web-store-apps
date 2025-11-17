// libs
import * as bcrypt from "bcrypt";
// constants
import { BCRYPT } from "@/core/configs/security";

export const hashPassword = (password: string): string =>
  bcrypt.hashSync(password, BCRYPT.SALT_ROUNDS);

export const isValidPassword = (password: string, hash: string): boolean =>
  bcrypt.compareSync(password, hash);
