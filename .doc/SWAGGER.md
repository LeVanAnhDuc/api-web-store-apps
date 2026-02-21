# Swagger Configuration Guide

## Overview

Project sử dụng **Programmatic OpenAPI** thay vì JSDoc annotations.

**Ưu điểm:**
- Type-safe với TypeScript
- Request schemas tự động generate từ Joi validation
- Dễ maintain khi scale (mỗi module tự quản lý swagger)
- Không cần `swagger-jsdoc` dependency

---

## Architecture

```
core/configs/swagger/
├── index.ts              # Main config - merge tất cả modules
└── common.schemas.ts     # Shared schemas (SuccessResponse, ErrorResponse, etc.)

modules/{module}/swagger/
├── index.ts              # Barrel exports
├── schemas.ts            # Request schemas (từ Joi) + Response schemas
└── paths.ts              # OpenAPI paths definitions
```

---

## Files Explanation

### 1. `core/configs/swagger/index.ts`

Main entry point - merge tất cả module swagger configs:

```typescript
import { loginSwaggerSchemas, loginPaths } from "@/modules/login/swagger";
import { signupSwaggerSchemas, signupPaths } from "@/modules/signup/swagger";
import { logoutSwaggerSchemas, logoutPaths } from "@/modules/logout/swagger";

const allSchemas = {
  ...commonSchemas,
  ...loginSwaggerSchemas,
  ...signupSwaggerSchemas,
  ...logoutSwaggerSchemas
};

const allPaths = {
  ...loginPaths,
  ...signupPaths,
  ...logoutPaths
};

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  paths: allPaths,
  components: { schemas: allSchemas, responses: commonResponses }
};
```

### 2. `core/configs/swagger/common.schemas.ts`

Shared schemas dùng chung cho tất cả endpoints:

- `SuccessResponse` - Response thành công
- `ErrorResponse` - Response lỗi
- `ValidationErrorResponse` - Lỗi validation
- `FieldError` - Chi tiết lỗi từng field

Common responses:
- `ValidationError` (400)
- `Unauthorized` (401)
- `Forbidden` (403)
- `NotFound` (404)
- `Conflict` (409)
- `TooManyRequests` (429)

### 3. `core/configs/swagger.setup.ts`

Setup Swagger UI cho Express app:

```typescript
import { openApiSpec } from "./swagger";

export const setupSwagger = (app: Application): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get("/api-docs.json", (_req, res) => res.send(openApiSpec));
};
```

---

## Module Swagger Structure

### `modules/{module}/swagger/schemas.ts`

```typescript
import j2s from "joi-to-swagger";
import { loginSchema } from "@/modules/login/schema";

// Request schemas - Generate từ Joi (DRY)
const { swagger: LoginRequestSchema } = j2s(loginSchema);

// Response schemas - Define thủ công
const LoginResponseSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  properties: {
    accessToken: { type: "string", description: "JWT access token" },
    refreshToken: { type: "string", description: "JWT refresh token" }
  }
};

export const loginSwaggerSchemas = {
  LoginRequest: LoginRequestSchema,
  LoginResponse: LoginResponseSchema
};
```

### `modules/{module}/swagger/paths.ts`

```typescript
export const loginPaths: OpenAPIV3.PathsObject = {
  "/auth/login": {
    post: {
      summary: "Login with email and password",
      tags: ["Auth - Login"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Login successful",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginResponse" }
            }
          }
        },
        "401": { $ref: "#/components/responses/Unauthorized" }
      }
    }
  }
};
```

### `modules/{module}/swagger/index.ts`

Barrel export:

```typescript
export { loginSwaggerSchemas } from "./schemas";
export { loginPaths } from "./paths";
```

---

## How to Add New Module

### Step 1: Create swagger folder

```
modules/user/swagger/
├── index.ts
├── schemas.ts
└── paths.ts
```

### Step 2: Define schemas (`schemas.ts`)

```typescript
import j2s from "joi-to-swagger";
import type { OpenAPIV3 } from "openapi-types";
import { createUserSchema, updateUserSchema } from "@/modules/user/schema";

// Request schemas từ Joi
const { swagger: CreateUserRequestSchema } = j2s(createUserSchema);
const { swagger: UpdateUserRequestSchema } = j2s(updateUserSchema);

// Response schemas
const UserResponseSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    fullName: { type: "string" }
  }
};

export const userSwaggerSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  CreateUserRequest: CreateUserRequestSchema as OpenAPIV3.SchemaObject,
  UpdateUserRequest: UpdateUserRequestSchema as OpenAPIV3.SchemaObject,
  UserResponse: UserResponseSchema
};
```

### Step 3: Define paths (`paths.ts`)

```typescript
import type { OpenAPIV3 } from "openapi-types";

export const userPaths: OpenAPIV3.PathsObject = {
  "/users": {
    get: {
      summary: "Get all users",
      tags: ["Users"],
      responses: {
        "200": {
          description: "List of users",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/UserResponse" }
              }
            }
          }
        }
      }
    },
    post: {
      summary: "Create user",
      tags: ["Users"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateUserRequest" }
          }
        }
      },
      responses: {
        "201": {
          description: "User created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserResponse" }
            }
          }
        }
      }
    }
  }
};
```

### Step 4: Export (`index.ts`)

```typescript
export { userSwaggerSchemas } from "./schemas";
export { userPaths } from "./paths";
```

### Step 5: Register in main config

Update `core/configs/swagger/index.ts`:

```typescript
import { userSwaggerSchemas, userPaths } from "@/modules/user/swagger";

const allSchemas = {
  ...commonSchemas,
  ...loginSwaggerSchemas,
  ...signupSwaggerSchemas,
  ...logoutSwaggerSchemas,
  ...userSwaggerSchemas  // ← Add here
};

const allPaths = {
  ...loginPaths,
  ...signupPaths,
  ...logoutPaths,
  ...userPaths  // ← Add here
};
```

### Step 6: Add tag (optional)

```typescript
tags: [
  { name: "Auth - Signup", description: "User registration" },
  { name: "Auth - Login", description: "User authentication" },
  { name: "Users", description: "User management" }  // ← Add here
]
```

---

## Common Patterns

### Reference shared response

```typescript
responses: {
  "400": { $ref: "#/components/responses/ValidationError" },
  "401": { $ref: "#/components/responses/Unauthorized" },
  "429": { $ref: "#/components/responses/TooManyRequests" }
}
```

### Wrap data in SuccessResponse

```typescript
responses: {
  "200": {
    description: "Success",
    content: {
      "application/json": {
        schema: {
          allOf: [
            { $ref: "#/components/schemas/SuccessResponse" },
            {
              type: "object",
              properties: {
                data: { $ref: "#/components/schemas/UserResponse" }
              }
            }
          ]
        }
      }
    }
  }
}
```

### Path parameters

```typescript
"/users/{id}": {
  get: {
    parameters: [
      {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "string" },
        description: "User ID"
      }
    ]
  }
}
```

### Query parameters

```typescript
"/users": {
  get: {
    parameters: [
      {
        in: "query",
        name: "page",
        schema: { type: "integer", default: 1 }
      },
      {
        in: "query",
        name: "limit",
        schema: { type: "integer", default: 10 }
      }
    ]
  }
}
```

### Protected endpoint (Bearer Auth)

```typescript
"/users/me": {
  get: {
    security: [{ bearerAuth: [] }],
    responses: {
      "401": { $ref: "#/components/responses/Unauthorized" }
    }
  }
}
```

---

## Access Swagger UI

- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json

---

## Dependencies

```json
{
  "dependencies": {
    "swagger-ui-express": "^5.x",
    "joi-to-swagger": "^6.x"
  },
  "devDependencies": {
    "openapi-types": "^12.x"
  }
}
```

---

## Tips

1. **Luôn generate request schemas từ Joi** - Đảm bảo validation và docs luôn sync
2. **Response schemas define thủ công** - Joi không có cho response
3. **Dùng `$ref`** - Tái sử dụng schemas, tránh duplicate
4. **Mỗi module tự quản lý swagger** - Dễ maintain khi scale
5. **Type-safe với `OpenAPIV3`** - IDE autocomplete, catch errors sớm
