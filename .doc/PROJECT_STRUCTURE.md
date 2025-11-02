# Cấu Trúc Dự Án - Apartment Web Server

## 📋 Mục Lục
- [Tổng Quan](#tổng-quan)
- [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
- [Chi Tiết Các Thư Mục](#chi-tiết-các-thư-mục)
- [Nguyên Tắc Import](#nguyên-tắc-import)
- [Quy Tắc Đặt Tên](#quy-tắc-đặt-tên)
- [Module Pattern](#module-pattern)
- [Best Practices](#best-practices)

---

## 🎯 Tổng Quan

Dự án sử dụng kiến trúc **Modular Monolith** với cấu trúc phân tầng rõ ràng:
- **Core Layer**: Chứa các thành phần dùng chung (shared infrastructure)
- **Module Layer**: Các tính năng nghiệp vụ độc lập (feature modules)
- **API Layer**: Quản lý routing và versioning
- **Database Layer**: Quản lý kết nối và models

---

## 📁 Cấu Trúc Thư Mục

```
src/
├── api/                          # API Layer - Routing & Versioning
│   └── v1/
│       └── routes/
│           ├── index.ts          # Main router (tổng hợp các routes)
│           └── auth.routes.ts    # Auth module routes
│
├── core/                         # Core Layer - Shared Infrastructure
│   ├── configs/                  # Cấu hình hệ thống
│   │   ├── env.ts               # Environment variables
│   │   └── logger.ts            # Logger configuration
│   │
│   ├── constants/               # Hằng số dùng chung
│   │   ├── index.ts
│   │   ├── libs/                # Constants cho libs
│   │   │   ├── otp.ts
│   │   │   └── token.ts
│   │   ├── models/              # Model names
│   │   └── status/              # HTTP status codes & phrases
│   │
│   ├── middlewares/             # Middleware dùng chung
│   │   ├── auth.middleware.ts   # Authentication
│   │   ├── errorHandler.ts     # Error handling
│   │   ├── requestLogger.ts    # Request logging
│   │   └── validate.ts         # Schema validation & rate limiting
│   │
│   ├── repositories/            # Base repository pattern
│   │   └── base.repo.ts        # Generic CRUD operations
│   │
│   ├── responses/               # Response standardization
│   │   ├── error.response.ts   # Error response classes
│   │   └── success.response.ts # Success response classes
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── common.ts           # Common types
│   │   ├── jwt.ts              # JWT types
│   │   ├── mongodb.ts          # MongoDB types
│   │   └── nodemailer.ts       # Email types
│   │
│   └── utils/                   # Utility functions
│       ├── asyncHandler.ts     # Async error wrapper
│       ├── bcrypt.ts           # Password hashing
│       ├── jwt.ts              # JWT operations
│       ├── logger.ts           # Logger wrapper
│       └── pagination.ts       # Pagination helpers
│
├── database/                    # Database Layer
│   ├── init.mongodb.ts         # MongoDB connection (Singleton)
│   ├── init.redis.ts           # Redis connection (Singleton)
│   └── models/                 # Mongoose models
│       └── auth.model.ts
│
├── modules/                     # Module Layer - Business Features
│   └── auth/                   # Authentication Module
│       ├── auth.controller.ts  # Request handlers
│       ├── auth.service.ts     # Business logic
│       ├── auth.repository.ts  # Data access
│       ├── auth.schema.ts      # Validation schemas (Joi)
│       ├── auth.types.ts       # Module-specific types
│       ├── index.ts            # Module exports
│       │
│       ├── constants/          # Module-specific constants
│       │   ├── email.ts        # Email templates
│       │   ├── endpoint.ts     # API endpoints
│       │   └── index.ts
│       │
│       ├── locales/            # Internationalization
│       │   ├── en/
│       │   ├── vi/
│       │   └── index.ts
│       │
│       ├── schemas/            # Validation schemas
│       │   └── common.schema.ts
│       │
│       └── utils/              # Module-specific utilities
│           └── otp.ts
│
├── app.ts                       # Express app configuration
└── server.ts                    # Server entry point
```

---

## 📚 Chi Tiết Các Thư Mục

### 1. **`api/` - API Layer**

**Mục đích**: Quản lý routing và API versioning

**Cấu trúc**:
```typescript
// api/v1/routes/index.ts
import { Router } from "express";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/auth", authRoutes);
// router.use("/users", userRoutes);

export default router;
```

**Quy tắc**:
- Mỗi version API có folder riêng (`v1/`, `v2/`)
- File `index.ts` tổng hợp tất cả routes
- Routes của mỗi module nằm trong file riêng (`auth.routes.ts`)

---

### 2. **`core/` - Core Layer**

**Mục đích**: Chứa các thành phần hạ tầng dùng chung cho toàn dự án

#### 2.1. **`core/configs/`** - Cấu Hình Hệ Thống

```typescript
// core/configs/env.ts
import * as dotenv from "dotenv";
dotenv.config();

const ENV = {
  APP_PORT: process.env.APP_PORT,
  DB_URL: process.env.DB_URL,
  DB_NAME: process.env.DB_NAME,
  // ...
};

export default ENV;
```

#### 2.2. **`core/middlewares/`** - Middleware Dùng Chung

```typescript
// core/middlewares/auth.middleware.ts
export const authorMiddleware = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  // Verify token logic...
  next();
});
```

#### 2.3. **`core/repositories/`** - Base Repository Pattern

```typescript
// core/repositories/base.repo.ts
class Repository<T extends Document> {
  constructor(
    protected model: Model<T>,
    protected modelName: string
  ) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id);
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }
  // ... other CRUD methods
}
```

#### 2.4. **`core/responses/`** - Response Standardization

```typescript
// core/responses/success.response.ts
export class OkSuccess<T> extends SuccessResponse<T> {
  constructor({ message, data }) {
    super({
      status: 200,
      reasonStatusCode: "OK",
      message,
      data
    });
  }
}

// Usage
new OkSuccess({ message: "Success", data: user }).send(res);
```

#### 2.5. **`core/utils/`** - Utility Functions

```typescript
// core/utils/asyncHandler.ts
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

---

### 3. **`modules/` - Module Layer**

**Mục đích**: Chứa các tính năng nghiệp vụ độc lập

#### Cấu trúc một Module (Auth Example)

```
modules/auth/
├── auth.controller.ts      # Request handlers (presentation layer)
├── auth.service.ts         # Business logic (business layer)
├── auth.repository.ts      # Data access (data layer)
├── auth.schema.ts          # Validation schemas
├── auth.types.ts           # TypeScript types
├── index.ts                # Module exports
├── constants/              # Module-specific constants
├── locales/                # i18n messages
├── schemas/                # Joi schemas
└── utils/                  # Module-specific utilities
```

#### Luồng xử lý trong Module (3-Layer Architecture)

```
Request → Controller → Service → Repository → Database
                                            ↓
Response ← Controller ← Service ← Repository ← Data
```

#### Code Example:

**Controller** (auth.controller.ts):
```typescript
// libs
import type { Request, Response } from "express";
// services
import authService from "./auth.service";
// responses
import { OkSuccess } from "@/core/responses/success.response";
// others
import { asyncHandler } from "@/core/utils/asyncHandler";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });

  new OkSuccess(result).send(res);
});
```

**Service** (auth.service.ts):
```typescript
// libs
import * as bcrypt from "@/core/utils/bcrypt";
import * as jwt from "@/core/utils/jwt";
// types
import type { ISuccessResponse } from "@/core/types/common";
// repositories
import type AuthRepository from "./auth.repository";
// responses
import { BadRequestError } from "@/core/responses/error.response";

class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async login({ email, password }): Promise<Partial<ISuccessResponse>> {
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) throw new BadRequestError("Invalid credentials");

    const isValid = bcrypt.isValidPassword(password, user.password);
    if (!isValid) throw new BadRequestError("Invalid credentials");

    const tokens = jwt.generatePairToken({ userId: user._id });

    return {
      message: "Login successful",
      data: tokens
    };
  }
}
```

**Repository** (auth.repository.ts):
```typescript
// types
import type { IAuthDocument } from "./auth.types";
// models
import AuthModel from "@/database/models/auth.model";
// repositories
import Repository from "@/core/repositories/base.repo";

class AuthRepository extends Repository<IAuthDocument> {
  constructor() {
    super(AuthModel, "Authentication");
  }

  async findUserByEmail(email: string) {
    return this.findOne({ email });
  }
}
```

---

### 4. **`database/` - Database Layer**

**Mục đích**: Quản lý kết nối database và models

#### 4.1. **Connection Management (Singleton Pattern)**

```typescript
// database/init.mongodb.ts
class MongoDatabase {
  private static instance: MongoDatabase | null = null;

  public static getInstance(): MongoDatabase {
    if (!this.instance) {
      this.instance = new MongoDatabase(mongoConfig);
    }
    return this.instance;
  }

  async connect(): Promise<void> {
    await mongoose.connect(this.config.url, this.config.options);
  }
}

export default MongoDatabase;
```

#### 4.2. **Models**

```typescript
// database/models/auth.model.ts
import { Schema, model } from "mongoose";
import type { IAuthDocument } from "@/modules/auth/auth.types";

const AuthSchema = new Schema<IAuthDocument>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verifiedEmail: { type: Boolean, default: false }
}, {
  collection: "authentications",
  timestamps: true
});

const Auth = model<IAuthDocument>("Authentication", AuthSchema);

export default Auth;
```

---

## 🔄 Nguyên Tắc Import

### Thứ tự import CHUẨN:

```typescript
// 1. libs - External packages
import express from "express";
import type { Request, Response } from "express";

// 2. types - Type imports
import type { IUser } from "./user.types";
import type { ISuccessResponse } from "@/core/types/common";

// 3. models - Database models
import UserModel from "@/database/models/user.model";

// 4. repositories - Data access
import UserRepository from "./user.repository";

// 5. controllers - Request handlers
import UserController from "./user.controller";

// 6. services - Business logic
import userService from "./user.service";

// 7. middlewares - Middleware functions
import { authorMiddleware } from "@/core/middlewares/auth.middleware";

// 8. responses - Response classes
import { OkSuccess } from "@/core/responses/success.response";
import { BadRequestError } from "@/core/responses/error.response";

// 9. others - Constants, utilities, etc.
import CONSTANTS from "@/core/constants";
import { asyncHandler } from "@/core/utils/asyncHandler";
```

### Quy tắc:
1. ✅ Comment viết **thường** (`// libs`, không phải `// Libs` hay `// LIBS`)
2. ✅ Mỗi nhóm cách nhau bằng comment
3. ✅ Không có dòng trống giữa các import trong cùng nhóm
4. ✅ Có dòng trống giữa các nhóm
5. ✅ `type` imports luôn dùng `import type { ... }`

---

## 📝 Quy Tắc Đặt Tên

### Files:
- **Module files**: `moduleName.type.ts` (e.g., `auth.controller.ts`, `user.service.ts`)
- **Config files**: `configName.ts` (e.g., `env.ts`, `logger.ts`)
- **Constant files**: `camelCase.ts` (e.g., `endpoint.ts`, `email.ts`)

### Classes:
- **PascalCase**: `AuthController`, `UserService`, `MongoDatabase`

### Functions:
- **camelCase**: `getUserById`, `createUser`, `validateToken`

### Constants:
- **UPPER_SNAKE_CASE**: `STATUS_CODES`, `REASON_PHRASES`, `OTP_LENGTH`

### Interfaces:
- **PascalCase with I prefix**: `IUser`, `IAuthDocument`, `ISuccessResponse`

### Types:
- **PascalCase with T prefix**: `TGender`, `TUserRole`

### Enums:
- **PascalCase with E prefix**: `EGender`, `EUserStatus`, `EConnectionState`

---

## 🏗️ Module Pattern

### Cách tạo một Module mới:

1. **Tạo cấu trúc folder**:
```bash
modules/
└── newModule/
    ├── newModule.controller.ts
    ├── newModule.service.ts
    ├── newModule.repository.ts
    ├── newModule.schema.ts
    ├── newModule.types.ts
    └── index.ts
```

2. **Định nghĩa Types**:
```typescript
// newModule.types.ts
export interface INewModule {
  _id: string;
  name: string;
  createdAt: Date;
}

export interface INewModuleDocument extends INewModule, Document {}
```

3. **Tạo Repository**:
```typescript
// newModule.repository.ts
import Repository from "@/core/repositories/base.repo";

class NewModuleRepository extends Repository<INewModuleDocument> {
  constructor() {
    super(NewModuleModel, "NewModule");
  }
}

export default NewModuleRepository;
```

4. **Tạo Service**:
```typescript
// newModule.service.ts
class NewModuleService {
  constructor(private readonly repository: NewModuleRepository) {}

  async getAll() {
    return this.repository.find({});
  }
}

export default new NewModuleService(new NewModuleRepository());
```

5. **Tạo Controller**:
```typescript
// newModule.controller.ts
export const getAll = asyncHandler(async (req, res) => {
  const data = await newModuleService.getAll();
  new OkSuccess({ data }).send(res);
});
```

6. **Export Module**:
```typescript
// index.ts
import NewModuleRepository from "./newModule.repository";
import NewModuleService from "./newModule.service";
import * as NewModuleController from "./newModule.controller";

const repository = new NewModuleRepository();
const service = new NewModuleService(repository);

export { repository, service, NewModuleController };
```

7. **Tạo Routes**:
```typescript
// api/v1/routes/newModule.routes.ts
import { Router } from "express";
import { NewModuleController } from "@/modules/newModule";

const router = Router();
router.get("/", NewModuleController.getAll);

export default router;
```

8. **Đăng ký Routes**:
```typescript
// api/v1/routes/index.ts
import newModuleRoutes from "./newModule.routes";

router.use("/new-module", newModuleRoutes);
```

---

## ✅ Best Practices

### 1. **Separation of Concerns**
- Controller chỉ xử lý HTTP request/response
- Service chứa business logic
- Repository xử lý database operations

### 2. **Error Handling**
```typescript
// ✅ ĐÚNG - Sử dụng custom error classes
throw new BadRequestError("Invalid email format");

// ❌ SAI - Throw generic errors
throw new Error("Invalid email format");
```

### 3. **Async/Await**
```typescript
// ✅ ĐÚNG - Sử dụng asyncHandler wrapper
export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  new OkSuccess({ data: user }).send(res);
});

// ❌ SAI - Không xử lý error
export const getUser = async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.json(user);
};
```

### 4. **Type Safety**
```typescript
// ✅ ĐÚNG - Sử dụng TypeScript types
interface ILoginRequest {
  email: string;
  password: string;
}

async login(data: ILoginRequest): Promise<ISuccessResponse> {
  // ...
}

// ❌ SAI - Không có types
async login(data) {
  // ...
}
```

### 5. **Dependency Injection**
```typescript
// ✅ ĐÚNG - DI pattern
class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository
  ) {}
}

// ❌ SAI - Hard-coded dependencies
class AuthService {
  async login() {
    const authRepository = new AuthRepository(); // Bad!
  }
}
```

### 6. **Validation**
```typescript
// ✅ ĐÚNG - Validate trong routes
router.post(
  "/login",
  validateSchema({ body: loginSchema }),
  asyncHandler(authController.login)
);

// ❌ SAI - Validate trong controller/service
```

### 7. **Response Format**
```typescript
// ✅ ĐÚNG - Sử dụng response classes
new OkSuccess({
  message: "User retrieved successfully",
  data: user
}).send(res);

// ❌ SAI - Response thủ công
res.status(200).json({ user });
```

### 8. **Environment Variables**
```typescript
// ✅ ĐÚNG - Sử dụng config file
import config from "@/core/configs/env";
const port = config.APP_PORT;

// ❌ SAI - Truy cập trực tiếp
const port = process.env.APP_PORT;
```

### 9. **Database Connection**
```typescript
// ✅ ĐÚNG - Singleton pattern
const mongoDb = MongoDatabase.getInstance();
await mongoDb.connect();

// ❌ SAI - Multiple connections
await mongoose.connect(url);
```

### 10. **File Organization**
```typescript
// ✅ ĐÚNG - Tách biệt concerns
modules/auth/
├── auth.controller.ts   # HTTP layer
├── auth.service.ts      # Business logic
├── auth.repository.ts   # Data access

// ❌ SAI - Tất cả trong một file
modules/auth/auth.ts     # Everything here
```

---

## 🚀 Quick Start Guide

### 1. Clone và Setup
```bash
git clone <repository>
cd server
npm install
cp .env.example .env
```

### 2. Cấu hình Environment
```env
# .env
APP_PORT=3000
DB_URL=mongodb://localhost:27017
DB_NAME=apartment_db
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
```

### 3. Chạy Development
```bash
npm run dev
```

### 4. Kiểm tra TypeScript
```bash
npm run type-check
```

### 5. Build Production
```bash
npm run build
npm start
```

---

## 📞 Liên Hệ & Support

Nếu có thắc mắc về cấu trúc dự án, vui lòng:
1. Đọc kỹ document này
2. Tham khảo code trong modules hiện có (đặc biệt là `auth` module)
3. Liên hệ team lead hoặc senior developers

---

**Last Updated**: 2025-01-02
**Version**: 1.0.0
