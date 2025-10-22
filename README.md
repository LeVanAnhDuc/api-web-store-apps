# API-express-learn

## 1. Giới thiệu

API được viết bằng TS compile qua JS

## 2. Cài đặt dự án (require: Mongo, Node)

### Bước 1: Cài đặt dependencies

```bash
npm install
# hoặc
yarn install
# hoặc
pnpm install
```

### Bước 2: Cấu hình môi trường

- Tạo file `.env` và cấu hình các biến môi trường cần thiết

### Bước 3: Chạy server development

```bash
npm run dev
```

### Bước 4: Truy cập

- Server đã được chạy với host là: "localhost:3000"

## 3. Các lệnh khả dụng

```bash
npm run dev          # Chạy server ở chế độ development với nodemon
npm run build        # Build TypeScript sang JavaScript
npm start            # Build và chạy production server
npm run lint         # Kiểm tra code với ESLint
npm run lint:fix     # Tự động fix các lỗi ESLint có thể sửa được
npm run format       # Format code với Prettier
npm run format:check # Kiểm tra format code mà không thay đổi files
```

> **Lưu ý:** Bạn có thể sử dụng npm, yarn hoặc pnpm tùy thích. Chỉ cần thống nhất trong một dự án và không commit lock files của package manager khác.

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
