# Code Quality Tools Guide

> **Hướng dẫn chi tiết về ESLint, Prettier, Husky và Lint-staged**
>
> **Level**: Beginner to Senior | **Last updated**: 2025-10-22

---

## 📚 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Prettier - Code Formatter](#prettier---code-formatter)
3. [ESLint - Code Linter](#eslint---code-linter)
4. [Husky - Git Hooks](#husky---git-hooks)
5. [Lint-staged - Pre-commit Tool](#lint-staged---pre-commit-tool)
6. [Workflow tích hợp](#workflow-tích-hợp)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Tổng quan

### 🎯 4 Tools và vai trò của chúng

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Workflow                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Viết code                                                │
│     ↓                                                        │
│  2. ESLint kiểm tra (trong IDE) ──→ Hiện lỗi ngay           │
│     ↓                                                        │
│  3. Prettier format (auto save) ──→ Code đẹp tự động        │
│     ↓                                                        │
│  4. Git commit                                               │
│     ↓                                                        │
│  5. Husky chặn commit ───────────→ Chạy pre-commit hook     │
│     ↓                                                        │
│  6. Lint-staged chạy ────────────→ Chỉ check files changed  │
│     ├─→ ESLint --fix                                         │
│     └─→ Prettier --write                                     │
│     ↓                                                        │
│  7. ✅ Commit thành công (nếu không có lỗi)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 📊 So sánh vai trò

| Tool | Vai trò | Khi nào chạy | Có thể skip? |
|------|---------|--------------|--------------|
| **Prettier** | Format code (spacing, quotes, etc.) | Save file, Pre-commit | ✅ Có (không khuyến khích) |
| **ESLint** | Tìm bugs, enforce code standards | IDE realtime, Pre-commit | ✅ Có (không khuyến khích) |
| **Husky** | Chạy commands trước Git events | Pre-commit, Pre-push | ❌ Không (trừ khi `--no-verify`) |
| **Lint-staged** | Chỉ check files đã thay đổi | Pre-commit (via Husky) | ❌ Không |

---

## Prettier - Code Formatter

### 🎨 Prettier là gì?

**Prettier** là một **opinionated code formatter** - tool tự động format code theo một style nhất quán.

### 🤔 Tại sao cần Prettier?

**Không có Prettier:**
```javascript
// Dev A viết
const user={name:"John",age:25,email:"john@example.com"}

// Dev B viết
const user = {
  name: "John",
  age: 25,
  email: "john@example.com"
};

// Dev C viết
const user = { name: 'John', age: 25, email: 'john@example.com' }

// 😫 3 styles khác nhau → Code review mệt mỏi
```

**Có Prettier:**
```javascript
// Tất cả devs → Prettier format → Same style
const user = {
  name: "John",
  age: 25,
  email: "john@example.com"
};

// ✅ Consistent, không còn tranh cãi về style
```

### 📁 File cấu hình: `.prettierrc`

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

### 🔍 Giải thích từng option

#### 1. `bracketSpacing` - Khoảng trắng trong brackets

```json
"bracketSpacing": true
```

**So sánh:**
```javascript
// true (có space)
const obj = { foo: "bar" };
import { useState } from "react";

// false (không space)
const obj = {foo: "bar"};
import {useState} from "react";
```

**💡 Newbie tip:** `true` dễ đọc hơn, là convention phổ biến.

---

#### 2. `printWidth` - Độ dài tối đa mỗi dòng

```json
"printWidth": 80
```

**Ý nghĩa:**
- Prettier sẽ cố gắng giữ code trong **80 ký tự mỗi dòng**
- Nếu dài quá → tự động xuống dòng

**Ví dụ:**
```javascript
// Dòng 85 ký tự → Prettier xuống dòng
function calculateTotalPriceWithTaxAndDiscount(price, tax, discount) {
  return price * (1 + tax) - discount;
}

// Sau khi Prettier format
function calculateTotalPriceWithTaxAndDiscount(
  price,
  tax,
  discount
) {
  return price * (1 + tax) - discount;
}
```

**🎓 Senior tip:**
- `80`: Classic, fits most screens
- `100`: Modern, popular choice
- `120`: Wider screens
- Chọn theo team preference

---

#### 3. `semi` - Dấu chấm phẩy cuối dòng

```json
"semi": true
```

**So sánh:**
```javascript
// true
const name = "John";
const age = 25;

// false
const name = "John"
const age = 25
```

**⚠️ Lưu ý:**
- `true`: JavaScript convention (khuyến khích)
- `false`: Có thể gây bugs khi không hiểu ASI (Automatic Semicolon Insertion)

**🐛 Bug example với semi: false:**
```javascript
const result = multiply(2, 3)
[1, 2, 3].forEach(console.log)

// JavaScript hiểu thành:
const result = multiply(2, 3)[1, 2, 3].forEach(console.log)
// 💥 Error!
```

---

#### 4. `singleQuote` - Loại quotes

```json
"singleQuote": false
```

**So sánh:**
```javascript
// false (dùng double quotes)
const name = "John";
const message = "Hello World";

// true (dùng single quotes)
const name = 'John';
const message = 'Hello World';
```

**💡 Tip:**
- `false`: Phổ biến với JSON, TypeScript
- `true`: Phổ biến với JavaScript thuần
- **Quan trọng:** Consistency > Personal preference

---

#### 5. `tabWidth` - Số spaces cho 1 tab

```json
"tabWidth": 2
```

**So sánh:**
```javascript
// tabWidth: 2
function hello() {
··return "world";
}

// tabWidth: 4
function hello() {
····return "world";
}
```

**🎓 Conventions:**
- **2 spaces**: JavaScript, TypeScript (popular)
- **4 spaces**: Python, Java
- **Tab character**: Go, Makefile

---

#### 6. `trailingComma` - Dấu phẩy cuối

```json
"trailingComma": "none"
```

**Options:**
- `"none"`: Không có trailing comma
- `"es5"`: Có trong objects/arrays (ES5 compatible)
- `"all"`: Có ở mọi nơi (ES2017+)

**So sánh:**
```javascript
// "none"
const obj = {
  name: "John",
  age: 25
};

// "es5"
const obj = {
  name: "John",
  age: 25,
};

// "all"
function hello(
  name,
  age,
) {
  // ...
}
```

**💡 Benefit của trailing comma:**
```diff
const obj = {
  name: "John",
- age: 25
+ age: 25,
+ email: "john@example.com"
};

// Git diff sạch hơn với trailing comma
const obj = {
  name: "John",
  age: 25,
+ email: "john@example.com",
};
```

---

#### 7. `quoteProps` - Quotes cho object keys

```json
"quoteProps": "as-needed"
```

**Options & So sánh:**
```javascript
// "as-needed" (chỉ quote khi cần)
const obj = {
  name: "John",
  age: 25,
  "first-name": "John"  // Cần quote vì có dấu gạch
};

// "consistent" (consistent trong object)
const obj = {
  "name": "John",
  "age": 25,
  "first-name": "John"
};

// "preserve" (giữ nguyên như dev viết)
```

**💡 Recommended:** `"as-needed"` - only quote khi syntax yêu cầu.

---

#### 8. `endOfLine` - Line ending

```json
"endOfLine": "auto"
```

**Options:**
- `"lf"`: Line Feed (`\n`) - Unix/Mac
- `"crlf"`: Carriage Return + Line Feed (`\r\n`) - Windows
- `"cr"`: Carriage Return (`\r`) - Old Mac
- `"auto"`: Tự động detect

**🤔 Tại sao quan trọng?**

```bash
# Windows
file.txt   CRLF (^M$)

# Mac/Linux
file.txt   LF ($)

# Git commit → Conflict vì line endings khác nhau
```

**💡 Best practice:**
- Dùng `"auto"` để Prettier tự handle
- Configure Git: `git config core.autocrlf true` (Windows)

---

#### 9. `arrowParens` - Parentheses cho arrow functions

```json
"arrowParens": "always"
```

**So sánh:**
```javascript
// "always"
const square = (x) => x * x;
const greet = (name) => `Hello ${name}`;

// "avoid"
const square = x => x * x;
const greet = name => `Hello ${name}`;
```

**🎓 Trade-off:**
- `"always"`: Consistent, dễ thêm params sau
- `"avoid"`: Ngắn gọn hơn

---

### 📁 File: `.prettierignore`

```
package-lock.json
public
node_modules
yarn.lock
dist
.vscode
.doc
```

**Ý nghĩa:**
- Danh sách files/folders **không được format** bởi Prettier
- Giống như `.gitignore`

**🤔 Tại sao ignore?**

| File/Folder | Lý do |
|-------------|-------|
| `node_modules` | Dependencies, không nên modify |
| `dist`, `build` | Generated code, sẽ bị overwrite |
| `package-lock.json` | Auto-generated, không nên edit |
| `.vscode` | IDE settings, personal preferences |
| `.doc` | Documentation với format đặc biệt |

---

### 🚀 Cách sử dụng

#### Trong IDE (VS Code)

1. **Install extension:**
   - Prettier - Code formatter

2. **Enable format on save:**
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

3. **Auto format khi save file** ✨

#### Command line

```bash
# Format toàn bộ project
npm run format

# Check format (không sửa)
npm run format:check
```

---

## ESLint - Code Linter

### 🔍 ESLint là gì?

**ESLint** là tool **phân tích code** để tìm bugs, code smells và enforce coding standards.

### 🤔 Prettier vs ESLint?

| Aspect | Prettier | ESLint |
|--------|----------|--------|
| **Focus** | Code formatting (style) | Code quality (bugs, patterns) |
| **Example** | Spaces, quotes, semicolons | Unused variables, missing return |
| **Can fix?** | ✅ 100% auto-fix | ⚠️ ~60% auto-fix |
| **Opinionated?** | ✅ Rất opinionated | ⚠️ Configurable |

**Ví dụ:**

```javascript
// ❌ ESLint lỗi (code quality)
function calculateTotal(price) {
  const tax = 0.1;  // ❌ 'tax' is assigned but never used
  return price;
}

// ❌ Prettier lỗi (formatting)
const user={name:"John",age:25}  // ❌ Missing spaces
```

### 📁 File cấu hình: `eslint.config.mts`

```typescript
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginPrettier from "eslint-plugin-prettier";
import pluginPromise from "eslint-plugin-promise";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      prettier: pluginPrettier,
      promise: pluginPromise,
      "unused-imports": pluginUnusedImports
    },
    rules: {
      // ... rules
    }
  },
  {
    ignores: ["node_modules", "dist", "build", ".husky", ".doc"]
  }
);
```

### 🔍 Cấu trúc config

#### 1. `files` - File patterns để lint

```typescript
files: ["**/*.{js,mjs,cjs,ts,mts,cts}"]
```

**Ý nghĩa:**
- Lint tất cả files: `.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`
- `**/*` = tất cả folders và subfolders

---

#### 2. `languageOptions` - Cấu hình ngôn ngữ

```typescript
languageOptions: {
  globals: {
    ...globals.node,      // Node.js globals (process, __dirname, etc.)
    ...globals.es2021     // ES2021 globals (Promise, Map, Set, etc.)
  },
  parser: tseslint.parser,  // TypeScript parser
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json"
  }
}
```

**🤔 Tại sao cần `globals`?**

```javascript
// Không có globals.node → ESLint báo lỗi
console.log(__dirname);  // ❌ '__dirname' is not defined

// Có globals.node → OK
console.log(__dirname);  // ✅
```

**Parser options:**
- `ecmaVersion: "latest"`: Support latest JavaScript features
- `sourceType: "module"`: Dùng ES modules (import/export)
- `project`: Path đến `tsconfig.json` (cho TypeScript rules)

---

#### 3. `plugins` - ESLint plugins

```typescript
plugins: {
  "@typescript-eslint": tseslint.plugin,
  prettier: pluginPrettier,
  promise: pluginPromise,
  "unused-imports": pluginUnusedImports
}
```

**Plugin là gì?**
- Mở rộng ESLint với rules bổ sung
- Mỗi plugin có một set rules riêng

**Plugins trong project:**

| Plugin | Mục đích | Example Rule |
|--------|----------|--------------|
| `@typescript-eslint` | TypeScript rules | `no-explicit-any` |
| `prettier` | Integrate Prettier | `prettier/prettier` |
| `promise` | Promise best practices | `promise/catch-or-return` |
| `unused-imports` | Remove unused imports | `unused-imports/no-unused-imports` |

---

### 📜 Rules - Chi tiết

```typescript
rules: {
  ...pluginJs.configs.recommended.rules,

  // Prettier integration
  "prettier/prettier": [
    "error",
    { endOfLine: "auto" }
  ],

  // TypeScript rules
  "@typescript-eslint/explicit-function-return-type": "off",
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/ban-ts-comment": "warn",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }
  ],
  "@typescript-eslint/consistent-type-imports": "error",

  // General JavaScript rules
  "no-undef": "off",
  "no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }
  ],
  "prefer-const": "warn",
  "no-var": "error",
  "no-console": "warn",
  "spaced-comment": "error",
  "arrow-body-style": ["error", "as-needed"],

  // Import rules
  "unused-imports/no-unused-imports": "error",

  // Promise rules
  "promise/always-return": "warn",
  "promise/no-return-wrap": "warn",
  "promise/param-names": "warn",
  "promise/catch-or-return": "warn"
}
```

### 🔍 Giải thích các rules quan trọng

#### 1. `prettier/prettier` - Integrate với Prettier

```typescript
"prettier/prettier": ["error", { endOfLine: "auto" }]
```

**Ý nghĩa:**
- Prettier issues = ESLint errors
- Auto-fix với `eslint --fix`

---

#### 2. `@typescript-eslint/no-explicit-any` - Cấm `any`

```typescript
"@typescript-eslint/no-explicit-any": "error"
```

**Tại sao cấm?**
```typescript
// ❌ Bad - Mất type safety
function process(data: any) {
  return data.value;  // Không biết data có property 'value' không
}

// ✅ Good - Type-safe
interface Data {
  value: string;
}

function process(data: Data) {
  return data.value;  // ✅ TypeScript check
}
```

**💡 Newbie tip:** `any` = tắt TypeScript. Chỉ dùng khi thực sự cần thiết.

---

#### 3. `@typescript-eslint/no-unused-vars` - Unused variables

```typescript
"@typescript-eslint/no-unused-vars": [
  "error",
  {
    argsIgnorePattern: "^_",
    varsIgnorePattern: "^_"
  }
]
```

**Cách hoạt động:**

```typescript
// ❌ Error
function hello(name) {  // 'name' is defined but never used
  return "Hello";
}

// ✅ OK - Prefix với _
function hello(_name) {  // OK, explicitly ignored
  return "Hello";
}

// ✅ OK - Actually used
function hello(name) {
  return `Hello ${name}`;
}
```

**🎓 Pattern:**
- Prefix `_` = "I know this is unused, it's intentional"
- Common cho Express middleware: `_req`, `_res`, `_next`

---

#### 4. `@typescript-eslint/consistent-type-imports`

```typescript
"@typescript-eslint/consistent-type-imports": "error"
```

**Enforce style:**
```typescript
// ❌ Bad
import { User, UserRole } from './types';

// ✅ Good (nếu chỉ dùng cho types)
import type { User, UserRole } from './types';
```

**Benefit:**
- Code splitting tốt hơn
- Build output nhỏ hơn
- Clear separation: runtime vs compile-time

---

#### 5. `prefer-const` - Prefer const over let

```typescript
"prefer-const": "warn"
```

```javascript
// ❌ Warning
let name = "John";  // Never reassigned
console.log(name);

// ✅ Good
const name = "John";
console.log(name);
```

**💡 Why?**
- `const` = immutable binding → easier to reason about code
- Modern JavaScript best practice

---

#### 6. `no-var` - No var keyword

```typescript
"no-var": "error"
```

```javascript
// ❌ Error
var name = "John";

// ✅ Use const/let
const name = "John";
let age = 25;
```

**🎓 History:**
- `var`: Old JavaScript (ES5), function-scoped, hoisting issues
- `const/let`: Modern (ES6+), block-scoped, no hoisting

---

#### 7. `no-console` - Warn console statements

```typescript
"no-console": "warn"
```

```javascript
// ⚠️ Warning
console.log("Debug info");

// ✅ Production
logger.info("Application started");
```

**💡 Why warn, not error?**
- Development: `console.log` useful for debugging
- Production: Should use proper logger
- **Pre-commit**: Won't block commit (just warning)

---

#### 8. `arrow-body-style` - Arrow function style

```typescript
"arrow-body-style": ["error", "as-needed"]
```

```javascript
// ❌ Error (unnecessary block)
const double = (x) => {
  return x * 2;
};

// ✅ Good (concise)
const double = (x) => x * 2;

// ✅ Good (block needed for multiple statements)
const process = (x) => {
  const result = x * 2;
  console.log(result);
  return result;
};
```

---

#### 9. `unused-imports/no-unused-imports` - Remove unused imports

```typescript
"unused-imports/no-unused-imports": "error"
```

```javascript
// ❌ Error
import { useState, useEffect } from 'react';  // useEffect not used

function App() {
  const [count] = useState(0);
  return <div>{count}</div>;
}

// ✅ Auto-fixed by eslint --fix
import { useState } from 'react';

function App() {
  const [count] = useState(0);
  return <div>{count}</div>;
}
```

**💡 Benefit:**
- Cleaner code
- Smaller bundle size
- Easier to refactor

---

#### 10. Promise rules - Promise best practices

```typescript
"promise/always-return": "warn",
"promise/catch-or-return": "warn",
"promise/param-names": "warn"
```

**Examples:**

```javascript
// ❌ promise/always-return
doSomething()
  .then((data) => {
    console.log(data);
    // ❌ No return
  });

// ✅ Good
doSomething()
  .then((data) => {
    console.log(data);
    return data;  // ✅ Return for chaining
  });

// ❌ promise/catch-or-return
doSomething()
  .then((data) => data);
  // ❌ No .catch() or return

// ✅ Good
doSomething()
  .then((data) => data)
  .catch((error) => console.error(error));

// ❌ promise/param-names
new Promise((resolve, reject) => {  // ✅ Standard names
  // ...
});

new Promise((success, failure) => {  // ❌ Non-standard
  // ...
});
```

---

### 🚀 Cách sử dụng

```bash
# Check lỗi
npm run lint

# Auto-fix lỗi có thể fix
npm run lint:fix
```

**Trong IDE:**
- ESLint extension → Hiện lỗi realtime
- Red squiggly lines under problematic code

---

## Husky - Git Hooks

### 🎣 Husky là gì?

**Husky** giúp dễ dàng sử dụng **Git hooks** - scripts chạy tự động tại các Git events.

### 🤔 Git hooks là gì?

**Git hooks** = Scripts chạy **trước hoặc sau** Git commands

```bash
git commit     # Trigger: pre-commit hook
               ↓
         Husky chạy script
               ↓
         Lint-staged
               ↓
    ESLint + Prettier check
               ↓
    ✅ Pass → Commit
    ❌ Fail → Block commit
```

### 📁 Cấu trúc thư mục

```
.husky/
├── _/                    # Husky internals
│   ├── husky.sh
│   └── ...
└── pre-commit           # Pre-commit hook script
```

### 📄 File: `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**Giải thích từng dòng:**

#### 1. `#!/bin/sh`
- **Shebang** - Chỉ định shell để chạy script
- `/bin/sh` = Bourne shell (compatible với mọi Unix/Linux)

#### 2. `. "$(dirname "$0")/_/husky.sh"`
- Load Husky helper functions
- `$(dirname "$0")` = Thư mục chứa script này (`.husky/`)
- `.` = Source command (chạy script trong current shell)

#### 3. `npx lint-staged`
- Chạy lint-staged
- `npx` = Execute package (không cần install globally)

### 🔧 Setup Husky

**Đã setup sẵn trong project qua:**
```json
// package.json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

**`prepare` script:**
- Tự động chạy sau `npm install`
- Setup Git hooks

### 🎯 Available Git hooks

| Hook | Khi nào chạy | Use case |
|------|--------------|----------|
| `pre-commit` | Trước khi commit | Lint, format, tests |
| `commit-msg` | Sau khi viết commit message | Validate message format |
| `pre-push` | Trước khi push | Run tests, build check |
| `post-commit` | Sau khi commit | Notifications, cleanup |
| `pre-merge-commit` | Trước merge commit | Validate merge |

**Project hiện tại dùng:**
- ✅ `pre-commit`: Run lint-staged

### ⚠️ Skip hooks (khi cần thiết)

```bash
# Skip pre-commit hook
git commit --no-verify -m "WIP: work in progress"

# Hoặc
git commit -n -m "Emergency fix"
```

**🚨 Warning:**
- Chỉ dùng trong emergency
- Code có thể không pass quality checks
- CI/CD có thể fail

---

## Lint-staged - Pre-commit Tool

### ⚡ Lint-staged là gì?

**Lint-staged** chỉ chạy linters/formatters trên **files đã staged** (files sắp commit).

### 🤔 Tại sao cần Lint-staged?

**Không có lint-staged:**
```bash
git commit

# ESLint check TOÀN BỘ project
# 1000 files × 50ms = 50 giây 😱
```

**Có lint-staged:**
```bash
git commit

# ESLint check CHỈ 3 files đã thay đổi
# 3 files × 50ms = 150ms ⚡
```

### 📁 Cấu hình trong `package.json`

```json
{
  "lint-staged": {
    "**/*.{js,ts,mts,cts}": [
      "eslint --fix",
      "prettier --write"
    ],
    "**/*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### 🔍 Giải thích cấu hình

#### Pattern 1: JavaScript/TypeScript files

```json
"**/*.{js,ts,mts,cts}": [
  "eslint --fix",
  "prettier --write"
]
```

**Ý nghĩa:**
- **Pattern**: `**/*.{js,ts,mts,cts}` = Tất cả .js, .ts, .mts, .cts files
- **Commands chạy theo thứ tự:**
  1. `eslint --fix` - Fix lỗi ESLint
  2. `prettier --write` - Format code

**Flow:**
```
file.ts (staged)
     ↓
ESLint --fix
     ↓
Prettier --write
     ↓
✅ Staged lại (nếu có thay đổi)
     ↓
Commit
```

#### Pattern 2: JSON và Markdown files

```json
"**/*.{json,md}": [
  "prettier --write"
]
```

**Ý nghĩa:**
- Chỉ chạy Prettier (không có ESLint cho JSON/MD)
- Format JSON, README.md, docs, etc.

### 🎯 Workflow chi tiết

```bash
# 1. Dev sửa files
vim src/app.ts src/user.ts README.md

# 2. Stage files
git add src/app.ts src/user.ts README.md

# 3. Commit
git commit -m "feat: add user management"

# 4. Husky trigger pre-commit hook
# 5. Lint-staged chạy:

# src/app.ts:
#   → eslint --fix src/app.ts
#   → prettier --write src/app.ts

# src/user.ts:
#   → eslint --fix src/user.ts
#   → prettier --write src/user.ts

# README.md:
#   → prettier --write README.md

# 6. Nếu có lỗi không auto-fix được:
#    ❌ Commit bị block
#    → Dev phải fix manually

# 7. Nếu pass:
#    ✅ Commit thành công
```

### 🚀 Test lint-staged

```bash
# Manual test (không cần commit)
npx lint-staged
```

---

## Workflow tích hợp

### 🔄 Complete Development Workflow

```
┌─────────────────────────────────────────────────────────┐
│                    Daily Development                     │
└─────────────────────────────────────────────────────────┘

1. Write Code
   ├─→ ESLint (IDE) shows errors realtime
   └─→ Prettier formats on save

2. Save File
   └─→ Auto-formatted by Prettier

3. Test Locally
   ├─→ npm run dev (nodemon)
   └─→ Manual testing

4. Stage Changes
   └─→ git add .

5. Commit
   ├─→ git commit -m "message"
   ├─→ Husky triggers pre-commit hook
   ├─→ Lint-staged runs on staged files
   │   ├─→ ESLint --fix
   │   └─→ Prettier --write
   │
   ├─→ ✅ Pass: Commit succeeds
   └─→ ❌ Fail: Commit blocked
       └─→ Fix errors manually
           └─→ Try commit again

6. Push
   └─→ git push origin feature-branch

7. Create PR
   └─→ CI/CD runs full checks
```

### 🎯 Layers of Protection

```
Layer 1: IDE (Development)
├─→ ESLint extension
├─→ Prettier extension
└─→ Instant feedback

Layer 2: Pre-commit (Local)
├─→ Husky + Lint-staged
├─→ Auto-fix what's possible
└─→ Block commit if errors

Layer 3: CI/CD (Remote)
├─→ Full test suite
├─→ Build check
└─→ Block merge if fails
```

**💡 Philosophy:**
- **Catch early**: Fix issues during development
- **Fast feedback**: Don't wait until commit
- **Team consistency**: Everyone follows same rules

---

## Troubleshooting

### ❌ Problem 1: Husky hooks không chạy

**Symptoms:**
```bash
git commit -m "test"
# Commit thẳng, không chạy lint-staged
```

**Nguyên nhân:**
- Husky chưa được install
- `.git/hooks` không có symlinks

**Giải pháp:**

```bash
# 1. Check husky installed
npm list husky

# 2. Reinstall hooks
npm run prepare

# 3. Verify
ls -la .git/hooks/
# Should see: pre-commit -> ../../.husky/pre-commit
```

---

### ❌ Problem 2: ESLint quá chậm

**Symptoms:**
```bash
npm run lint
# Chạy 30 giây+
```

**Nguyên nhân:**
- Lint toàn bộ node_modules
- TypeScript type checking chậm

**Giải pháp:**

```typescript
// eslint.config.mts
{
  ignores: [
    "node_modules",  // ✅ Bỏ qua node_modules
    "dist",
    "build"
  ]
}
```

---

### ❌ Problem 3: Prettier và ESLint conflict

**Symptoms:**
```bash
# Prettier format → ESLint báo lỗi
# Hoặc: ESLint fix → Prettier lại format khác
```

**Nguyên nhân:**
- Rules conflict giữa Prettier và ESLint

**Giải pháp:**

1. **Use eslint-config-prettier:**
```bash
npm install --save-dev eslint-config-prettier
```

2. **Add to ESLint config:**
```typescript
import prettierConfig from "eslint-config-prettier";

export default [
  // ... other configs
  prettierConfig  // ← Disable conflicting rules
];
```

---

### ❌ Problem 4: Pre-commit quá lâu

**Symptoms:**
```bash
git commit
# Đợi 5-10 giây mỗi lần commit
```

**Nguyên nhân:**
- Lint-staged check quá nhiều files
- ESLint/Prettier chạy chậm

**Giải pháp:**

1. **Check files được process:**
```bash
# Debug lint-staged
DEBUG=lint-staged* git commit
```

2. **Optimize patterns:**
```json
{
  "lint-staged": {
    // ❌ Bad: Check tất cả
    "**/*": ["eslint --fix"],

    // ✅ Good: Chỉ check cần thiết
    "**/*.{js,ts}": ["eslint --fix"],
    "**/*.{json,md}": ["prettier --write"]
  }
}
```

---

### ❌ Problem 5: Cannot commit với --no-verify

**Symptoms:**
```bash
git commit --no-verify
# Vẫn bị block
```

**Nguyên nhân:**
- Git config có issues
- Husky config sai

**Giải pháp:**

```bash
# 1. Check Git version
git --version  # Should be 2.9+

# 2. Uninstall and reinstall Husky
rm -rf .husky
npm uninstall husky
npm install --save-dev husky
npm run prepare
```

---

## Best Practices

### ✅ DO

#### 1. **Install IDE extensions**

```
VS Code Extensions:
├─→ ESLint (dbaeumer.vscode-eslint)
├─→ Prettier (esbenp.prettier-vscode)
└─→ EditorConfig (editorconfig.editorconfig)
```

#### 2. **Enable format on save**

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

#### 3. **Run checks before commit**

```bash
# Manual check
npm run lint
npm run format:check
npm run type-check

# Then commit
git commit -m "feat: add feature"
```

#### 4. **Fix issues incrementally**

```bash
# Fix one file at a time
npm run lint:fix src/app.ts

# Commit
git add src/app.ts
git commit -m "fix: resolve linting issues in app.ts"
```

#### 5. **Keep configs synced**

```bash
# Prettier rules
.prettierrc

# ESLint integration
eslint.config.mts
└─→ prettier/prettier rule

# Ensure no conflicts
```

---

### ❌ DON'T

#### 1. **Don't skip hooks frequently**

```bash
# ❌ Bad habit
git commit --no-verify -m "quick fix"
git commit --no-verify -m "another fix"

# ✅ Good: Fix issues properly
npm run lint:fix
git commit -m "fix: resolve linting issues"
```

#### 2. **Don't disable rules without reason**

```typescript
// ❌ Bad
{
  rules: {
    "@typescript-eslint/no-explicit-any": "off",  // Why?
    "no-console": "off"  // Lazy
  }
}

// ✅ Good: Keep strict rules
{
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": "warn"  // Allow in dev, warn for review
  }
}
```

#### 3. **Don't commit unformatted code**

```bash
# ❌ Bad
git add .
git commit --no-verify  # Skip formatting

# ✅ Good
npm run format
git add .
git commit
```

#### 4. **Don't ignore IDE warnings**

```typescript
// ❌ Bad: Ignore red squiggles
const user: any = getData();  // Red squiggle → Ignore
console.log(user.name);

// ✅ Good: Fix immediately
interface User {
  name: string;
}
const user: User = getData();
console.log(user.name);
```

---

## 🎓 Learning Path

### For Newbies

**Week 1: Understanding**
1. Đọc docs này
2. Setup IDE extensions
3. Watch tools hoạt động

**Week 2: Practice**
1. Commit code với pre-commit hooks
2. Fix ESLint errors manually
3. Hiểu error messages

**Week 3: Mastery**
1. Config custom rules
2. Debug hook issues
3. Help teammates

---

### For Seniors

**Advanced Topics:**
1. Custom ESLint rules
2. Shared configs (publishable)
3. Performance optimization
4. CI/CD integration
5. Monorepo setup

---

## 📚 Resources

### Official Docs
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)
- [Husky](https://typicode.github.io/husky/)
- [Lint-staged](https://github.com/okonet/lint-staged)

### Related Guides
- [TypeScript ESLint](https://typescript-eslint.io/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Git Hooks](https://git-scm.com/docs/githooks)

---

## 🎯 Quick Reference

### Commands

```bash
# Formatting
npm run format          # Format all files
npm run format:check    # Check formatting

# Linting
npm run lint           # Check for errors
npm run lint:fix       # Auto-fix errors

# Type checking
npm run type-check     # Check types once
npm run dev:check      # Watch mode

# Git
git commit             # Triggers hooks
git commit --no-verify # Skip hooks (emergency only)
```

### File Structure

```
server/
├── .husky/
│   └── pre-commit           # Git hook script
├── .prettierrc              # Prettier config
├── .prettierignore          # Prettier ignore
├── eslint.config.mts        # ESLint config
└── package.json
    ├── scripts              # npm scripts
    └── lint-staged          # Lint-staged config
```

---

**Happy coding with quality!** 🚀✨

---

**Tài liệu này được tạo bởi:** Development Team
**Version:** 1.0
**Last updated:** 2025-10-22
