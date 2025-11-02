# API-express-learn

## 1. Giới thiệu

API được viết bằng TS compile qua JS

### 📚 Tài liệu chi tiết

Xem thêm các tài liệu kỹ thuật chi tiết trong folder [`.doc/`](./.doc/):

- 🏗️ [**PROJECT OVERVIEW**](./.doc/PROJECT_OVERVIEW.md) - Tổng quan architecture, coding standards (MUST READ!)
- 📝 [Logger System Guide](./.doc/logger.md) - Hướng dẫn sử dụng Winston Logger
- ⚙️ [Nodemon Configuration Guide](./.doc/nodemon-config.md) - Giải thích chi tiết cấu hình Nodemon
- 🛠️ [Code Quality Tools Guide](./.doc/code-quality-tools.md) - Hướng dẫn ESLint, Prettier, Husky, Lint-staged

## 2. Cài đặt dự án (require: Mongo, Node)

### Bước 1: Cài đặt dependencies

```bash
yarn install
```

### Bước 2: Cấu hình môi trường

- Tạo file `.env` và cấu hình các biến môi trường cần thiết

### Bước 3: Chạy server development

```bash
yarn dev
```

### Bước 4: Truy cập

- Server đã được chạy với host là: "localhost:3000"

## 3. Các lệnh khả dụng

### Development

```bash
yarn dev          # Chạy server với nodemon (fast reload, no type checking)
yarn dev:check    # Watch mode type checking (chạy trong terminal riêng)
yarn type-check   # Kiểm tra TypeScript types một lần
```

**💡 Workflow khuyến nghị:**

```bash
# Terminal 1: Development server (fast reload)
yarn dev

# Terminal 2 (optional): Type checking watch mode
yarn dev:check
```

Nodemon đã được tối ưu với:

- Fast restart với `--transpile-only`
- Delay 1000ms tránh restart nhiều lần
- Gõ `rs` trong terminal để force restart
- Auto clear console và hiển thị emoji khi restart/crash

### Production & Code Quality

```bash
yarn build        # Build TypeScript sang JavaScript
yarn start        # Build và chạy production server
yarn lint         # Kiểm tra code với ESLint
yarn lint:fix     # Tự động fix các lỗi ESLint có thể sửa được
yarn format       # Format code với Prettier
yarn format:check # Kiểm tra format code mà không thay đổi files
```

> **Lưu ý:** Dự án này sử dụng Yarn. Vui lòng chỉ commit `yarn.lock` và không commit `package-lock.json`.

## 4. Code Quality & Git Hooks

Dự án đã được cấu hình với:

- **ESLint**: Kiểm tra code quality và enforce coding standards
- **Prettier**: Tự động format code
- **Husky**: Git hooks để đảm bảo code quality trước khi commit
- **Lint-staged**: Tự động lint và format code khi commit

Khi commit code, husky sẽ tự động:

1. Chạy ESLint và tự động fix các lỗi có thể sửa được
2. Format code với Prettier
3. Chỉ cho phép commit nếu không có lỗi

## 5. Công nghệ sử dụng trong dự án

- Ngôn ngữ lập trình: TypeScript
- BE: Node(Express), bcrypt, jsonwebtoken, class-transformer, class-transformer, helmet, lodash, mongoose.
- DataBase: MongoDB.

### Những thứ đã làm được trong dự án

- API CRUD todo
- API login, register, refresh-token
- Validate data trước khi vào controller bằng DTO, class-validator, class-transformer
- Mô hình MVC
- Cấu hình webpack cơ bản
