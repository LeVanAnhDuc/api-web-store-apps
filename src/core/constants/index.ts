// others
import ENV from "@/core/configs/env";
import { TOKEN, OTP } from "./libs";
import { REASON_PHRASES, STATUS_CODES } from "./status";
import MODEL_NAME from "./models";

const CONSTANTS = {
  TOKEN,
  ENV,
  SALT_OR_ROUNDS: 10,
  OTP,
  REASON_PHRASES,
  STATUS_CODES,
  MODEL_NAME
};

export default CONSTANTS;
