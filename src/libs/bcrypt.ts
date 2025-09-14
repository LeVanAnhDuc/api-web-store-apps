// libs
import * as bcrypt from 'bcrypt';
// others
import CONSTANTS from '../constants';

export const hashPassword = (password: string) =>
  bcrypt.hashSync(password, CONSTANTS.SALT_OR_ROUNDS);

export const isValidPassword = (password: string, hash: string) =>
  bcrypt.compareSync(password, hash);
