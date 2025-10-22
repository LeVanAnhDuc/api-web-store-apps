# Nodemon Configuration Guide

> **Tài liệu hướng dẫn chi tiết về cấu hình Nodemon cho dự án Node.js + TypeScript**
>
> **Level**: Beginner to Senior | **Last updated**: 2025-10-22

---

## 📚 Mục lục

1. [Nodemon là gì?](#nodemon-là-gì)
2. [Tại sao cần Nodemon?](#tại-sao-cần-nodemon)
3. [Cấu hình hiện tại](#cấu-hình-hiện-tại)
4. [Giải thích từng option](#giải-thích-từng-option)
5. [So sánh với cấu hình khác](#so-sánh-với-cấu-hình-khác)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Nodemon là gì?

**Nodemon** (Node Monitor) là một tool giúp tự động restart Node.js application khi phát hiện có thay đổi trong source code.

### 🎯 Vấn đề nó giải quyết

**Không có Nodemon:**
```bash
node dist/app.js          # Chạy server
# Edit code...
Ctrl+C                     # Stop server manually
node dist/app.js          # Start lại manually
# Lặp lại mãi mãi... 😫
```

**Có Nodemon:**
```bash
nodemon                   # Chạy server
# Edit code...
# 🎉 Server tự động restart!
```

---

## Tại sao cần Nodemon?

### ✅ Lợi ích cho Developer

| Tính năng | Không có Nodemon | Có Nodemon |
|-----------|------------------|------------|
| **Restart khi save** | ❌ Manual | ✅ Automatic |
| **Thời gian restart** | ~5-10s (manual) | ~1-2s (auto) |
| **Developer Experience** | 😫 Mệt mỏi | 😊 Thoải mái |
| **Productivity** | Thấp | Cao |
| **Hot reload** | ❌ Không | ✅ Có |

### 💡 Khi nào dùng Nodemon?

- ✅ **Development**: LUÔN LUÔN dùng
- ❌ **Production**: KHÔNG BAO GIỜ dùng
- ❌ **Testing**: Tùy trường hợp
- ❌ **CI/CD**: Không cần

---

## Cấu hình hiện tại

File: `nodemon.json`

```json
{
  "watch": ["src", ".env"],
  "ext": "ts,js,json",
  "ignore": [
    "src/**/*.spec.ts",
    "src/**/*.test.ts",
    ".git",
    "node_modules",
    "dist",
    "build",
    "coverage",
    "logs",
    "*.log"
  ],
  "exec": "ts-node --transpile-only -r tsconfig-paths/register ./src/app.ts",
  "env": {
    "NODE_ENV": "development"
  },
  "restartable": "rs",
  "delay": 1000,
  "verbose": false,
  "colours": true,
  "legacyWatch": false,
  "signal": "SIGTERM",
  "events": {
    "restart": "echo '\\n🔄 Server restarting...\\n'",
    "crash": "echo '\\n💥 Server crashed! Fix the error and save to restart.\\n'"
  }
}
```

---

## Giải thích từng option

### 1. `watch` - Theo dõi thư mục/file nào?

```json
"watch": ["src", ".env"]
```

**Giải thích:**
- Nodemon sẽ theo dõi mọi thay đổi trong folder `src/` và file `.env`
- Khi có file thay đổi trong các path này → **restart server**

**Ví dụ:**
```
src/
  ├── app.ts          ✅ Watch
  ├── controllers/    ✅ Watch
  └── models/         ✅ Watch
.env                  ✅ Watch
dist/                 ❌ Ignore (trong ignore list)
node_modules/         ❌ Ignore (trong ignore list)
```

**💡 Tips cho Newbie:**
- Chỉ watch folders có source code
- Không watch `dist/`, `node_modules/` (tốn tài nguyên)

**🎓 Tips cho Senior:**
- Watch `.env` để restart khi đổi environment variables
- Có thể watch thêm `config/` nếu có config files

---

### 2. `ext` - Theo dõi file extensions nào?

```json
"ext": "ts,js,json"
```

**Giải thích:**
- Chỉ restart khi file có extension: `.ts`, `.js`, `.json` thay đổi
- File khác (`.md`, `.txt`, `.log`) thay đổi → **không restart**

**Ví dụ:**
```
✅ src/app.ts       → Restart
✅ src/config.json  → Restart
✅ src/utils.js     → Restart
❌ README.md        → Không restart
❌ server.log       → Không restart
```

**⚠️ Lưu ý:**
- Không có dấu chấm `.` trước extension
- Không có space sau dấu phẩy
- ❌ Sai: `".ts, .js, .json"` (có space và dấu chấm)
- ✅ Đúng: `"ts,js,json"`

---

### 3. `ignore` - Bỏ qua files/folders nào?

```json
"ignore": [
  "src/**/*.spec.ts",    // Test files
  "src/**/*.test.ts",    // Test files
  ".git",                // Git folder
  "node_modules",        // Dependencies
  "dist",                // Build output
  "build",               // Build output
  "coverage",            // Test coverage
  "logs",                // Log folder
  "*.log"                // Log files
]
```

**Giải thích:**
- Danh sách files/folders bị **bỏ qua**, không trigger restart
- Dùng glob patterns để match nhiều files

**🤔 Tại sao ignore?**

| File/Folder | Lý do ignore |
|-------------|--------------|
| `*.spec.ts`, `*.test.ts` | Test files không cần restart server |
| `node_modules/` | Dependencies thay đổi rất nhiều, không liên quan |
| `dist/`, `build/` | Output folders, thay đổi liên tục khi build |
| `.git/` | Git internals, không liên quan |
| `*.log` | Log files thay đổi liên tục |
| `coverage/` | Test coverage reports |

**💡 Glob patterns explained:**

```bash
src/**/*.spec.ts    # Tất cả .spec.ts files trong src/ và subfolders
*.log               # Tất cả .log files ở root
node_modules        # Folder node_modules
```

---

### 4. `exec` - Chạy lệnh gì khi start/restart?

```json
"exec": "ts-node --transpile-only -r tsconfig-paths/register ./src/app.ts"
```

**Giải thích từng phần:**

#### 4.1. `ts-node`
- Tool để chạy TypeScript trực tiếp mà không cần compile
- Thay vì: `tsc` (compile) → `node dist/app.js`
- Dùng: `ts-node src/app.ts` (chạy trực tiếp)

#### 4.2. `--transpile-only` ⚡ (QUAN TRỌNG!)

**Không có flag này:**
```bash
ts-node src/app.ts
# 1. Check types (3-5 giây)
# 2. Transpile code
# 3. Run code
# ⏱️ Tổng: ~5 giây mỗi lần restart
```

**Có flag này:**
```bash
ts-node --transpile-only src/app.ts
# 1. Skip type checking
# 2. Transpile code (nhanh)
# 3. Run code
# ⏱️ Tổng: ~1 giây mỗi lần restart
```

**🤔 Tại sao skip type checking?**
- Type checking chậm (3-5s)
- ESLint đã check types rồi (trong IDE)
- Pre-commit hook sẽ check types trước khi commit
- Development cần **SPEED**, production cần **SAFETY**

**🎓 Senior tip:**
- Chạy `npm run dev:check` trong terminal riêng để watch types
- Fast development loop + Type safety = Best of both worlds

#### 4.3. `-r tsconfig-paths/register`

**Vấn đề:**
```typescript
// ❌ Không có flag này
import { User } from '../../../../models/user';

// ✅ Có flag này
import { User } from '@/models/user';
```

**Giải thích:**
- `-r` = `--require` = load module trước khi chạy code
- `tsconfig-paths/register` = module đọc `paths` trong `tsconfig.json`
- Cho phép dùng path aliases như `@/` thay vì `../../../../`

**Cấu hình trong tsconfig.json:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 4.4. `./src/app.ts`
- Entry point của application
- File đầu tiên được chạy khi start server

---

### 5. `env` - Environment variables

```json
"env": {
  "NODE_ENV": "development"
}
```

**Giải thích:**
- Set environment variables khi chạy server
- `NODE_ENV=development` → app biết đang chạy ở development mode

**💡 Use cases:**

```typescript
// Trong code
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Debug mode ON');
  // Enable detailed logging
  // Show error stack traces
} else {
  // Production mode
  // Minimal logging
}
```

**🎓 Senior tip:**
- Có thể thêm nhiều env vars
```json
"env": {
  "NODE_ENV": "development",
  "DEBUG": "*",
  "LOG_LEVEL": "debug"
}
```
- Nhưng **không nên** put secrets ở đây
- Secrets nên ở `.env` file

---

### 6. `restartable` - Force restart command

```json
"restartable": "rs"
```

**Giải thích:**
- Gõ `rs` + Enter trong terminal → force restart server
- Không cần save file

**Khi nào dùng?**
- Clear cache
- Reload environment variables từ `.env`
- Debug issues
- Test restart behavior

**Demo:**
```bash
$ npm run dev
[nodemon] starting...
Server running on port 3000

rs  # ← Gõ rs và Enter
[nodemon] restarting...
Server running on port 3000
```

---

### 7. `delay` - Thời gian chờ trước khi restart

```json
"delay": 1000
```

**Giải thích:**
- Đợi **1000ms (1 giây)** sau khi detect changes
- Sau đó mới restart

**🤔 Tại sao cần delay?**

**Không có delay (delay: 0):**
```bash
Save file 1  → Restart (lần 1)
Save file 2  → Restart (lần 2)  # 0.1s sau
Save file 3  → Restart (lần 3)  # 0.1s sau
# 😫 Restart 3 lần không cần thiết
```

**Có delay (delay: 1000):**
```bash
Save file 1  → Đợi 1s...
Save file 2  → Đợi 1s... (reset timer)
Save file 3  → Đợi 1s... (reset timer)
# ✅ Chỉ restart 1 lần sau khi save hết
```

**💡 Tips chọn delay:**
- **500ms**: Nhanh, nhưng có thể restart nhiều lần
- **1000ms**: ✅ Cân bằng (recommended)
- **2000ms**: Chậm, nhưng chắc chắn chỉ restart 1 lần

---

### 8. `verbose` - Chi tiết log

```json
"verbose": false
```

**Giải thích:**
- `false`: Hiện log cơ bản
- `true`: Hiện log chi tiết (debug)

**So sánh:**

**verbose: false (recommended)**
```bash
[nodemon] starting...
[nodemon] restarting...
Server running ✅
```

**verbose: true**
```bash
[nodemon] starting `ts-node --transpile-only...`
[nodemon] watching: src/**/* .env
[nodemon] files triggering change check: src/app.ts
[nodemon] matched rule: **/*.ts
[nodemon] changes after filters (before/after): 1/1
[nodemon] restarting due to changes...
[nodemon] src/app.ts
... (nhiều log hơn)
```

**Khi nào bật verbose?**
- ❌ Development bình thường: `false`
- ✅ Debug nodemon issues: `true`
- ✅ Tìm hiểu nodemon works: `true`

---

### 9. `colours` - Màu sắc trong terminal

```json
"colours": true
```

**Giải thích:**
- `true`: Hiện màu sắc (đẹp, dễ đọc)
- `false`: Không màu (plain text)

**Demo:**

```bash
# colours: true (đẹp)
[nodemon] starting...      # Màu xanh
[nodemon] restarting...    # Màu vàng
Error: Connection failed   # Màu đỏ

# colours: false (không màu)
[nodemon] starting...
[nodemon] restarting...
Error: Connection failed
```

**💡 Tip:**
- Luôn bật `true` cho development
- Có thể tắt `false` cho CI/CD logs

---

### 10. `legacyWatch` - File watching method

```json
"legacyWatch": false
```

**Giải thích:**
- `false`: Dùng **modern** file watching (✅ Recommended)
- `true`: Dùng **legacy** polling method

**Sự khác biệt:**

| Modern Watch (false) | Legacy Polling (true) |
|---------------------|----------------------|
| ⚡ Nhanh | 🐢 Chậm |
| 💚 Ít CPU | 🔥 Tốn CPU |
| ✅ Recommended | ❌ Chỉ dùng khi cần |

**Khi nào dùng legacy?**
- Network drives (shared folders)
- Docker volumes
- Virtual machines
- Khi modern watch không hoạt động

**🎓 Senior tip:**
- Mặc định: `false`
- Nếu nodemon không detect changes → thử `true`

---

### 11. `signal` - Shutdown signal

```json
"signal": "SIGTERM"
```

**Giải thích:**
- Signal gửi đến process khi restart/stop
- `SIGTERM` = "Terminate gracefully"

**Các signals:**

| Signal | Ý nghĩa | Behavior |
|--------|---------|----------|
| `SIGTERM` | Graceful shutdown ✅ | Cho phép cleanup trước khi stop |
| `SIGKILL` | Force kill ❌ | Kill ngay lập tức, không cleanup |
| `SIGINT` | Ctrl+C | Interrupt process |

**💡 Graceful shutdown example:**

```typescript
// src/app.ts
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing server gracefully...');

  // 1. Stop accepting new connections
  server.close();

  // 2. Close database connections
  await mongoose.connection.close();

  // 3. Finish ongoing requests
  await Promise.all(pendingRequests);

  // 4. Exit
  process.exit(0);
});
```

**Tại sao quan trọng?**
- ✅ Finish ongoing database transactions
- ✅ Close connections properly
- ✅ Save state before exit
- ❌ Không làm = data loss, corrupted DB

---

### 12. `events` - Custom messages

```json
"events": {
  "restart": "echo '\\n🔄 Server restarting...\\n'",
  "crash": "echo '\\n💥 Server crashed! Fix the error and save to restart.\\n'"
}
```

**Giải thích:**
- Chạy commands khi events xảy ra
- `restart`: Khi server restart
- `crash`: Khi server crash

**Available events:**

| Event | Khi nào trigger? |
|-------|------------------|
| `start` | Lần đầu start server |
| `restart` | Mỗi lần restart |
| `crash` | Server crash/error |
| `exit` | Nodemon exit |
| `quit` | User quit (Ctrl+C) |

**💡 Use cases:**

```json
"events": {
  // Hiện thời gian restart
  "restart": "echo 'Restarted at $(date +%T)'",

  // Chạy tests sau mỗi restart
  "restart": "npm run test:quick",

  // Clear console
  "restart": "clear",

  // Multiple commands
  "restart": "clear && echo '🔄 Restarting...' && date"
}
```

**🎓 Senior tip:**
- Không nên chạy heavy commands (slow restart)
- Có thể dùng để trigger webhooks, notifications
- Cẩn thận với infinite loops

---

## So sánh với cấu hình khác

### ⚡ Fast Development (Current) vs 🐢 Safe Development

| Aspect | Fast (Current) | Safe |
|--------|----------------|------|
| **exec** | `--transpile-only` | No flag |
| **Type checking** | ❌ Skip | ✅ Check |
| **Startup time** | ~1s | ~5s |
| **Restart time** | ~1s | ~3-5s |
| **Type errors** | Không báo | Báo ngay |
| **Recommended for** | Daily development | Type-heavy projects |

**Config comparison:**

```json
// Fast Development (Current) ⚡
{
  "exec": "ts-node --transpile-only -r tsconfig-paths/register ./src/app.ts",
  "delay": 1000
}

// Safe Development 🐢
{
  "exec": "ts-node -r tsconfig-paths/register ./src/app.ts",
  "delay": 2000
}
```

**💡 Best of both worlds (Hybrid):**
```bash
# Terminal 1: Fast development
npm run dev

# Terminal 2: Type checking
npm run dev:check
```

---

## Troubleshooting

### ❌ Problem 1: Nodemon không restart khi save file

**Nguyên nhân:**
- File bị ignore
- Sai extension
- Network drive issues

**Giải pháp:**

1. Check file có bị ignore không:
```bash
# File spec.ts bị ignore
src/user.spec.ts  ❌

# Solution: Rename hoặc remove khỏi ignore list
```

2. Check extension:
```json
// Chỉ watch ts,js,json
"ext": "ts,js,json"

// Muốn watch .env thêm vào watch list
"watch": ["src", ".env"]
```

3. Thử legacy watch:
```json
"legacyWatch": true
```

---

### ❌ Problem 2: Restart nhiều lần liên tiếp

**Nguyên nhân:**
- Delay quá ngắn
- Watch output folder (`dist/`)

**Giải pháp:**

1. Tăng delay:
```json
"delay": 2000  // 2 seconds
```

2. Ignore dist folder:
```json
"ignore": [
  "dist",
  "build"
]
```

---

### ❌ Problem 3: Server chậm khởi động

**Nguyên nhân:**
- Type checking enabled
- Nhiều files quá

**Giải pháp:**

1. Enable transpile-only:
```json
"exec": "ts-node --transpile-only ..."
```

2. Ignore nhiều hơn:
```json
"ignore": [
  "**/*.test.ts",
  "**/*.spec.ts",
  "node_modules",
  "coverage"
]
```

---

### ❌ Problem 4: Error "Cannot find module '@/...'"

**Nguyên nhân:**
- Thiếu `tsconfig-paths/register`

**Giải pháp:**

1. Install package:
```bash
npm install --save-dev tsconfig-paths
```

2. Add vào exec:
```json
"exec": "ts-node -r tsconfig-paths/register ./src/app.ts"
```

3. Check tsconfig.json:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Best Practices

### ✅ DO

1. **Always ignore output folders**
```json
"ignore": ["dist", "build"]
```

2. **Use transpile-only for fast development**
```json
"exec": "ts-node --transpile-only ..."
```

3. **Set appropriate delay**
```json
"delay": 1000  // 1 second is good
```

4. **Watch .env file**
```json
"watch": ["src", ".env"]
```

5. **Enable colours for better UX**
```json
"colours": true
```

6. **Use SIGTERM for graceful shutdown**
```json
"signal": "SIGTERM"
```

### ❌ DON'T

1. **Don't watch node_modules**
```json
// ❌ Bad
"watch": ["src", "node_modules"]

// ✅ Good
"watch": ["src"]
"ignore": ["node_modules"]
```

2. **Don't use nodemon in production**
```json
// ❌ Bad
"start": "nodemon dist/app.js"

// ✅ Good
"start": "node dist/app.js"
"dev": "nodemon"
```

3. **Don't set delay too low**
```json
// ❌ Bad (restart nhiều lần)
"delay": 100

// ✅ Good
"delay": 1000
```

4. **Don't run heavy commands in events**
```json
// ❌ Bad (chậm)
"events": {
  "restart": "npm run test && npm run build"
}

// ✅ Good
"events": {
  "restart": "echo 'Restarting...'"
}
```

---

## 📚 Tài liệu tham khảo

- [Nodemon Official Docs](https://nodemon.io/)
- [Nodemon GitHub](https://github.com/remy/nodemon)
- [ts-node Documentation](https://typestrong.org/ts-node/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## ❓ FAQ

### Q1: Nodemon vs ts-node-dev?
**A:** Nodemon phổ biến hơn, stable hơn, community lớn hơn. `ts-node-dev` nhanh hơn một chút nhưng ít tính năng hơn.

### Q2: Có nên dùng nodemon cho production?
**A:** **KHÔNG!** Nodemon chỉ dùng cho development. Production dùng `node dist/app.js` (compiled code).

### Q3: Delay bao nhiêu là tốt nhất?
**A:** **1000ms** (1 giây) là lựa chọn tốt cho hầu hết trường hợp.

### Q4: Có nên type check khi development?
**A:** Tùy preference:
- Skip type checking (`--transpile-only`) → Fast
- Run `npm run dev:check` trong terminal riêng → Best of both worlds

### Q5: Làm sao để restart server nhanh hơn?
**A:**
1. Dùng `--transpile-only`
2. Ignore nhiều files
3. Tăng delay để tránh restart nhiều lần
4. Đừng watch output folders

---

## 🎓 Kết luận

Nodemon configuration này được optimize cho:
- ⚡ **Fast development** với `--transpile-only`
- 🛡️ **Type safety** với script `dev:check` riêng
- 🎨 **Developer experience** với colors, emoji, messages
- ⚙️ **Flexibility** với restartable, events, signals

**Happy coding!** 🚀

---

**Tài liệu này được tạo bởi:** Development Team
**Version:** 1.0
**Last updated:** 2025-10-22
