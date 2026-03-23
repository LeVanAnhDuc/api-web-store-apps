import type { OpenAPIV3 } from "openapi-types";

const UserProfileResponseSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  required: ["_id", "fullName", "email", "createdAt"],
  properties: {
    _id: {
      type: "string",
      example: "64f1b2c3d4e5f6a7b8c9d0e1",
      description: "User ID (MongoDB ObjectId)"
    },
    fullName: {
      type: "string",
      example: "Nguyen Van A"
    },
    email: {
      type: "string",
      format: "email",
      example: "user@example.com",
      description: "Taken from authenticated token"
    },
    phone: {
      type: "string",
      nullable: true,
      example: "+84 912 345 678"
    },
    avatar: {
      type: "string",
      nullable: true,
      example: "http://localhost:3000/uploads/avatars/uuid.jpg",
      description: "Full URL to avatar image, or null if not set"
    },
    address: {
      type: "string",
      nullable: true,
      example: "123 Le Loi, District 1, Ho Chi Minh City"
    },
    dateOfBirth: {
      type: "string",
      format: "date-time",
      nullable: true,
      example: "1995-06-15T00:00:00.000Z"
    },
    gender: {
      type: "string",
      nullable: true,
      enum: ["male", "female", "other", "prefer_not_to_say", null],
      example: "male"
    },
    createdAt: {
      type: "string",
      format: "date-time",
      example: "2026-01-01T00:00:00.000Z"
    }
  }
};

const PublicUserProfileResponseSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  required: ["_id", "fullName"],
  properties: {
    _id: {
      type: "string",
      example: "64f1b2c3d4e5f6a7b8c9d0e1"
    },
    fullName: {
      type: "string",
      example: "Nguyen Van A"
    },
    avatar: {
      type: "string",
      nullable: true,
      example: "http://localhost:3000/uploads/avatars/uuid.jpg"
    },
    gender: {
      type: "string",
      nullable: true,
      enum: ["male", "female", "other", "prefer_not_to_say", null],
      example: "female"
    }
  }
};

const UpdateProfileRequestSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  description: "All fields are optional. Only provided fields are updated.",
  properties: {
    fullName: {
      type: "string",
      minLength: 2,
      maxLength: 100,
      example: "Nguyen Van B",
      description: "Letters, spaces, hyphens, apostrophes, and dots only"
    },
    phone: {
      type: "string",
      minLength: 1,
      example: "+84 912 345 678",
      description: "Cannot be an empty string if provided"
    },
    address: {
      type: "string",
      maxLength: 500,
      example: "456 Nguyen Hue, District 1, Ho Chi Minh City"
    },
    dateOfBirth: {
      type: "string",
      format: "date",
      example: "1995-06-15",
      description:
        "ISO 8601 date. Must not be in the future, and age must not exceed 100 years."
    },
    gender: {
      type: "string",
      enum: ["male", "female", "other", "prefer_not_to_say"],
      example: "male"
    }
  }
};

const UploadAvatarRequestSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  required: ["avatar"],
  properties: {
    avatar: {
      type: "string",
      format: "binary",
      description:
        "Image file. Max 10MB. Allowed types: jpg, jpeg, png, webp, gif, avif"
    }
  }
};

const UploadAvatarResponseSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  properties: {
    avatarUrl: {
      type: "string",
      example:
        "http://localhost:3000/uploads/avatars/550e8400-e29b-41d4-a716-446655440000.jpg",
      description: "Full URL to the uploaded avatar"
    }
  }
};

export const userSwaggerSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  UserProfileResponse: UserProfileResponseSchema,
  PublicUserProfileResponse: PublicUserProfileResponseSchema,
  UpdateProfileRequest: UpdateProfileRequestSchema,
  UploadAvatarRequest: UploadAvatarRequestSchema,
  UploadAvatarResponse: UploadAvatarResponseSchema
};
