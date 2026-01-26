import { GENDERS } from "@/modules/user/constants";
import { AUTH_ROLES } from "@/modules/auth/constants";

export const TEST_USERS = [
  {
    auth: {
      email: "admin@test.com",
      password: "Admin@123",
      roles: AUTH_ROLES.ADMIN,
      verifiedEmail: true,
      isActive: true
    },
    user: {
      fullName: "Admin User",
      gender: GENDERS.MALE,
      dateOfBirth: new Date("1990-01-15")
    }
  },
  {
    auth: {
      email: "user@test.com",
      password: "User@123",
      roles: AUTH_ROLES.USER,
      verifiedEmail: true,
      isActive: true
    },
    user: {
      fullName: "Test User",
      gender: GENDERS.FEMALE,
      dateOfBirth: new Date("1995-06-20")
    }
  },
  {
    auth: {
      email: "user2@test.com",
      password: "User@123",
      roles: AUTH_ROLES.USER,
      verifiedEmail: true,
      isActive: true
    },
    user: {
      fullName: "John Doe",
      gender: GENDERS.MALE,
      dateOfBirth: new Date("1988-03-10")
    }
  },
  {
    auth: {
      email: "inactive@test.com",
      password: "Inactive@123",
      roles: AUTH_ROLES.USER,
      verifiedEmail: true,
      isActive: false
    },
    user: {
      fullName: "Inactive User",
      gender: GENDERS.OTHER,
      dateOfBirth: new Date("2000-12-01")
    }
  },
  {
    auth: {
      email: "unverified@test.com",
      password: "Unverified@123",
      roles: AUTH_ROLES.USER,
      verifiedEmail: false,
      isActive: true
    },
    user: {
      fullName: "Unverified User",
      gender: GENDERS.PREFER_NOT_TO_SAY,
      dateOfBirth: new Date("1992-08-25")
    }
  }
] as const;
