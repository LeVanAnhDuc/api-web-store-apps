# 🏢 Apartment Web Server - Project Overview & Coding Standards

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Coding Standards & Rules](#coding-standards--rules)
5. [Project Structure](#project-structure)
6. [Key Features](#key-features)
7. [Development Workflow](#development-workflow)

---

## Project Overview

**Project Name:** Apartment Web Server-Client
**Type:** Full-stack Monorepo Application
**Backend:** Express.js + TypeScript + MongoDB
**Frontend:** Next.js 15 (separate client folder)
**Purpose:** Apartment management system with authentication, user management, and scalable architecture

### Core Characteristics
- ✅ Production-ready architecture
- ✅ Type-safe development with TypeScript
- ✅ Feature-based modular structure
- ✅ Clean code with strict linting rules
- ✅ Comprehensive error handling
- ✅ Security-first approach
- ✅ Scalable and maintainable

---

## Technology Stack

### Core Technologies
| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Runtime** | Node.js | Latest | JavaScript runtime |
| **Language** | TypeScript | 5.4.5 | Type-safe development |
| **Framework** | Express.js | 4.19.2 | Web framework |
| **Database** | MongoDB | 8.3.1 | NoSQL database |
| **ODM** | Mongoose | 8.3.1 | MongoDB object modeling |
| **Cache** | Redis | 4.6.13 | Caching layer (optional) |

### Security & Authentication
| Technology | Purpose |
|------------|---------|
| **JWT** | Token-based authentication |
| **bcrypt** | Password hashing |
| **Helmet** | Security headers |
| **CORS** | Cross-origin resource sharing |
| **express-rate-limit** | Rate limiting |
| **speakeasy** | OTP generation |

### Validation & Data Processing
| Technology | Purpose |
|------------|---------|
| **Joi** | Schema validation |
| **class-validator** | DTO validation |
| **class-transformer** | Object transformation |

### Logging & Monitoring
| Technology | Purpose |
|------------|---------|
| **Winston** | Application logging |
| **winston-daily-rotate-file** | Log rotation |
| **Morgan** | HTTP request logging |

### Development Tools
| Technology | Purpose |
|------------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |
| **lint-staged** | Pre-commit linting |
| **Nodemon** | Auto-reload development |
| **ts-node** | TypeScript execution |

---

## Architecture Patterns

### 1. **Layered Architecture**
```
┌─────────────┐
│   Routes    │ → API endpoints definition
├─────────────┤
│ Controllers │ → Request/Response handling
├─────────────┤
│  Services   │ → Business logic
├─────────────┤
│Repositories │ → Data access layer
├─────────────┤
│   Models    │ → Database schemas
└─────────────┘
```

### 2. **Design Patterns Used**

| Pattern | Implementation | Location |
|---------|---------------|----------|
| **Singleton** | MongoDB connection manager | `databases/init.mongodb.ts` |
| **Repository** | Generic CRUD operations | `repositories/base.repo.ts` |
| **Dependency Injection** | Manual DI in modules | `modules/*/index.ts` |
| **Factory** | Response classes | `responses/*.response.ts` |
| **Adapter** | Library wrappers | `libs/*.ts` |
| **Middleware Chain** | Express middleware | `middlewares/*.ts` |

### 3. **Module Structure**
Each feature module follows this structure:
```
modules/[feature]/
├── [feature].controller.ts  # HTTP handlers
├── [feature].service.ts     # Business logic
├── [feature].repository.ts  # Data access
├── [feature].model.ts       # Mongoose schema
├── [feature].router.ts      # Route definitions
├── dtos/                    # Validation schemas
├── locales/                 # i18n
│   ├── en/
│   └── vi/
└── index.ts                 # DI & exports
```

---

## Coding Standards & Rules

### 1. **Import Organization Rules**

```typescript
// Order of imports (separated by blank lines):

// 1. External libraries
import express from "express";
import mongoose from "mongoose";

// 2. Internal dependencies - Types (with @/ alias)
import type { ISuccessResponse } from "@/types/common";
import type { IAuthDocument } from "@/types/modules/auth";

// 3. Internal dependencies - Libraries & Utils
import { bcrypt, jwt } from "@/libs";
import { Logger } from "@/utils/logger";

// 4. Internal dependencies - Constants
import config from "@/constants/env";
import { END_POINTS } from "@/constants/endpoint";

// 5. Models & Repositories
import AuthRepository from "./auth.repository";
import UserRepository from "../user/user.repository";

// 6. Response classes
import { BadRequestError, UnauthorizedError } from "@/responses/error.response";

// 7. Local module resources
import LOCALES from "./locales";
```

### 2. **Naming Conventions**

| Type | Convention | Example |
|------|------------|---------|
| **Files** | kebab-case | `auth.service.ts`, `init.mongodb.ts` |
| **Classes** | PascalCase | `AuthService`, `MongoDatabase` |
| **Interfaces** | I prefix + PascalCase | `IUser`, `IAuthDocument` |
| **Types** | T prefix + PascalCase | `TRole`, `TGender` |
| **Enums** | E prefix + PascalCase | `ERole`, `EGender` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |
| **Variables** | camelCase | `refreshToken`, `userId` |
| **Private fields** | camelCase | `private connectionState` |

### 3. **TypeScript Rules (ESLint)**

```javascript
// Key ESLint rules configured:
{
  "@typescript-eslint/explicit-function-return-type": "off",
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/ban-ts-comment": "warn",
  "@typescript-eslint/no-unused-vars": ["error", {
    argsIgnorePattern: "^_",
    varsIgnorePattern: "^_"
  }],
  "@typescript-eslint/consistent-type-imports": "error",
  "no-console": "warn",
  "prefer-const": "warn",
  "no-var": "error",
  "arrow-body-style": ["error", "as-needed"],
  "unused-imports/no-unused-imports": "error"
}
```

### 4. **Prettier Configuration**

```json
{
  "bracketSpacing": true,
  "printWidth": 80,
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "none",
  "quoteProps": "as-needed",
  "endOfLine": "auto",
  "arrowParens": "always"
}
```

### 5. **Type Definition Rules**

```typescript
// 1. Use `import type` for type-only imports
import type { Request } from "express";

// 2. Create dedicated type files in src/types/
src/types/
├── common.ts           # Shared types
├── modules/            # Feature-specific types
│   ├── auth/
│   └── user/
├── databases/          # Database types
├── jwt/                # JWT types
└── nodemailer/         # Email types

// 3. Export all types from index files
export * from "./mongodb";

// 4. Document complex types
/**
 * User authentication document interface
 * Extends MongoDB Document with auth fields
 */
export interface IAuthDocument extends IAuth, Document {
  _id: Schema.Types.ObjectId;
}
```

### 6. **Error Handling Standards**

```typescript
// 1. Use custom error classes
throw new BadRequestError("Invalid email or password");
throw new UnauthorizedError("Token expired");

// 2. Always use Logger for errors
Logger.error("Database connection failed", error);

// 3. Wrap async handlers
router.post("/login", asyncHandler(authController.login));

// 4. Return meaningful error messages
return {
  status: "Error",
  code: statusCode,
  message: error.message || "Internal Server Error"
};
```

### 7. **Documentation Standards**

```typescript
/**
 * MongoDB Connection Manager
 * Handles database connections with proper error handling and retry logic
 * @author Senior Backend Engineer
 * @version 2.0.0
 */

/**
 * Connect to MongoDB with proper error handling
 * @returns Promise<void>
 * @throws {Error} When connection fails after max retries
 */
public async connect(): Promise<void> {
  // Implementation
}
```

### 8. **Git Commit Rules**

Enforced by Husky pre-commit hooks:
1. ESLint must pass
2. Prettier formatting applied
3. No unused imports
4. TypeScript compilation must succeed

---

## Project Structure

```
server/
├── src/
│   ├── app.ts                    # Entry point
│   ├── constants/                # All constants
│   │   ├── endpoint.ts          # API endpoints
│   │   ├── env.ts               # Environment config
│   │   ├── libs/                # Library constants
│   │   ├── models/              # Model names
│   │   └── status/              # HTTP status codes
│   ├── databases/               # Database connections
│   │   ├── init.mongodb.ts      # MongoDB singleton
│   │   └── init.redis.ts        # Redis (optional)
│   ├── helper/                  # Helper functions
│   │   └── asyncHandler.ts      # Async wrapper
│   ├── libs/                    # Library wrappers
│   │   ├── bcrypt.ts           # Password hashing
│   │   ├── jwt.ts              # Token management
│   │   ├── nodemailer.ts       # Email service
│   │   └── speakeasy.otp.ts    # OTP generation
│   ├── middlewares/             # Express middlewares
│   │   ├── auth.middleware.ts   # Authentication
│   │   ├── handleError.middleware.ts  # Error handling
│   │   └── validate.middleware.ts     # Validation
│   ├── modules/                 # Feature modules
│   │   ├── auth/               # Authentication module
│   │   ├── user/               # User module
│   │   └── index.ts            # Router aggregator
│   ├── repositories/            # Data access layer
│   │   └── base.repo.ts        # Generic repository
│   ├── responses/               # Response formatters
│   │   ├── error.response.ts   # Error responses
│   │   └── success.response.ts # Success responses
│   ├── schema/                  # Validation schemas
│   │   └── common.schema.ts    # Shared schemas
│   ├── types/                   # TypeScript types
│   │   ├── common.ts           # Common types
│   │   ├── databases/          # Database types
│   │   ├── jwt/                # JWT types
│   │   ├── modules/            # Module types
│   │   └── nodemailer/         # Email types
│   └── utils/                   # Utilities
│       ├── logger.ts           # Winston logger
│       ├── logger.md           # Logger documentation
│       └── health-check.ts     # Health monitoring
├── dist/                        # Compiled output
├── logs/                        # Application logs
├── .doc/                        # Documentation
├── .husky/                      # Git hooks
├── eslint.config.mts           # ESLint config
├── tsconfig.json               # TypeScript config
├── nodemon.json                # Nodemon config
├── package.json                # Dependencies
└── .prettierrc                 # Prettier config
```

---

## Key Features

### 1. **Authentication System**
- JWT-based authentication
- Access & refresh token management
- Password reset with OTP
- Email verification
- Role-based access control (ADMIN, USER)

### 2. **Database Management**
- MongoDB with Mongoose ODM
- Connection pooling
- Automatic reconnection with exponential backoff
- Health monitoring
- Graceful shutdown

### 3. **Caching Layer**
- Optional Redis integration
- Repository-level caching
- Cache key generation strategy
- TTL management

### 4. **Security Features**
- Helmet.js security headers
- CORS configuration
- Rate limiting (2 min window, 10 requests)
- bcrypt password hashing (10 salt rounds)
- Request size limits (10MB)
- Input validation with Joi

### 5. **Logging System**
- Winston with daily rotation
- Separate error and combined logs
- Morgan HTTP request logging
- Structured JSON logging
- 30-day error log retention
- 14-day combined log retention

### 6. **Health Monitoring**
- `/health` - Full system health
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe
- Database connection status
- System metrics (CPU, memory)
- Response time tracking

### 7. **Error Handling**
- Custom error classes
- Global error middleware
- Async handler wrapper
- Meaningful error messages
- Error logging with stack traces

### 8. **Development Experience**
- TypeScript with path aliases (@/)
- Nodemon auto-reload
- ESLint + Prettier integration
- Husky pre-commit hooks
- Comprehensive logging
- Request ID tracking

---

## Development Workflow

### 1. **Setup**
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Setup git hooks
npm run prepare
```

### 2. **Development**
```bash
# Start development server with auto-reload
npm run dev

# Run TypeScript compiler in watch mode
npm run dev:check

# Check types without emitting
npm run type-check
```

### 3. **Code Quality**
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format with Prettier
npm run format

# Check Prettier formatting
npm run format:check
```

### 4. **Building**
```bash
# Build for production
npm run build

# Start production server
npm start
```

### 5. **Git Workflow**
Pre-commit hooks automatically:
1. Run ESLint fixes
2. Apply Prettier formatting
3. Remove unused imports
4. Validate TypeScript compilation

### 6. **API Endpoints**

Base URL: `/api/v1`

**Authentication:**
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/verify-signup` - Email verification
- `POST /auth/resend-otp` - Resend OTP
- `POST /auth/refresh-access-token` - Refresh token
- `POST /auth/send-otp-forgot-password` - Password reset OTP
- `POST /auth/confirm-otp-forgot-password` - Verify OTP
- `POST /auth/update-password-forgot-password` - Update password

**Health Check:**
- `GET /health` - System health status
- `GET /health/live` - Liveness check
- `GET /health/ready` - Readiness check

---

## Best Practices

### 1. **Code Organization**
- Keep modules self-contained
- Follow layered architecture
- Use dependency injection
- Maintain single responsibility

### 2. **Type Safety**
- Always define types/interfaces
- Use `import type` for type imports
- Avoid `any` type
- Document complex types

### 3. **Error Handling**
- Throw domain-specific errors
- Log all errors with context
- Return meaningful messages
- Use async handler wrapper

### 4. **Security**
- Never log sensitive data
- Validate all inputs
- Use environment variables
- Implement rate limiting

### 5. **Performance**
- Use connection pooling
- Implement caching where needed
- Compress responses
- Optimize database queries

### 6. **Testing**
- Write unit tests for services
- Integration tests for APIs
- Mock external dependencies
- Test error scenarios

### 7. **Documentation**
- Document complex logic
- Keep README updated
- Add JSDoc comments
- Maintain API documentation

---

## Environment Variables

Required environment variables in `.env`:

```env
# Application
NODE_ENV=development
APP_PORT=3000
CORS_ORIGIN=http://localhost:3001

# Database
DB_URL=mongodb://localhost:27017
DB_NAME=apartment_management

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_RESET_PASS_SECRET=your-reset-secret

# Email Service
USERNAME_EMAIL=your-email@gmail.com
PASSWORD_EMAIL=your-app-password

# Logging
LOG_LEVEL=debug
```

---

## Conclusion

This Express/TypeScript backend demonstrates enterprise-grade architecture with:
- ✅ Clean, maintainable code structure
- ✅ Comprehensive type safety
- ✅ Production-ready features
- ✅ Scalable module architecture
- ✅ Security best practices
- ✅ Professional development workflow

The codebase is well-organized, follows industry standards, and is ready for production deployment with minimal configuration.

---

*Last Updated: November 2024*
*Version: 2.0.0*
*Author: Senior Backend Engineer*