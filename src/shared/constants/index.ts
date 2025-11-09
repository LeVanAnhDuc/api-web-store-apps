// others
import ENV from "@/core/configs/env";
import { TOKEN } from "./libs";
import { REASON_PHRASES, STATUS_CODES } from "./status";
import MODEL_NAME from "./models";
import DATABASE from "./database";

const CONSTANTS = {
  TOKEN,
  ENV,
  SALT_OR_ROUNDS: 10,
  REASON_PHRASES,
  STATUS_CODES,
  MODEL_NAME,
  DATABASE
};

export default CONSTANTS;
