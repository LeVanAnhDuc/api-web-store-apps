// others
import END_POINTS from './endpoint';
import ENV from './env';
import { TOKEN, OTP, TEMPLATE_EMAIL } from './libs';
import { REASON_PHRASES, STATUS_CODES } from './status';

enum EGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

enum ERole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
}

const CONSTANTS = {
  EGender,
  ERole,
  END_POINTS,
  TOKEN,
  TEMPLATE_EMAIL,
  ENV,
  SALT_OR_ROUNDS: 10,
  OTP,
  REASON_PHRASES,
  STATUS_CODES,
};

export default CONSTANTS;
