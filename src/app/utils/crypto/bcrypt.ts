import * as bcrypt from "bcrypt";
import { BCRYPT } from "@/infra/configs/security";

export const hashValue = (value: string): string =>
  bcrypt.hashSync(value, BCRYPT.SALT_ROUNDS);

export const isValidHashedValue = (value: string, hash: string): boolean =>
  bcrypt.compareSync(value, hash);
