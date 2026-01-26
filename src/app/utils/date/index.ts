import { AGE_VALIDATION } from "@/modules/user/constants";

export const getDateOfBirthBounds = (): {
  minDate: Date;
  maxDate: Date;
} => {
  const now = new Date();

  const maxDate = new Date(now);
  maxDate.setFullYear(maxDate.getFullYear() - AGE_VALIDATION.MIN_AGE);

  const minDate = new Date(now);
  minDate.setFullYear(minDate.getFullYear() - AGE_VALIDATION.MAX_AGE);

  return { minDate, maxDate };
};
