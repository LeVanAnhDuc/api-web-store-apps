// others
import END_POINTS from "./endpoint";
import ENV from "./env";
import { TOKEN, OTP, TEMPLATE_EMAIL } from "./libs";
import { REASON_PHRASES, STATUS_CODES } from "./status";
import MODEL_NAME from "./models";

const CONSTANTS = {
  END_POINTS,
  TOKEN,
  TEMPLATE_EMAIL,
  ENV,
  SALT_OR_ROUNDS: 10,
  OTP,
  REASON_PHRASES,
  STATUS_CODES,
  MODEL_NAME
};

export default CONSTANTS;
