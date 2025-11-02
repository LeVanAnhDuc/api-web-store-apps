# 📚 Logger Documentation - Hướng dẫn sử dụng Logger

## 📖 Mục lục
1. [Logger là gì?](#logger-là-gì)
2. [Tại sao cần Logger?](#tại-sao-cần-logger)
3. [Cách sử dụng cơ bản](#cách-sử-dụng-cơ-bản)
4. [Các cấp độ log](#các-cấp-độ-log)
5. [Nơi lưu trữ logs](#nơi-lưu-trữ-logs)
6. [Tích hợp với Express](#tích-hợp-với-express)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Logger là gì?

Logger là một công cụ giúp ghi lại các sự kiện xảy ra trong ứng dụng của bạn. Giống như một "nhật ký" tự động, nó ghi lại:
- Lỗi xảy ra khi nào, ở đâu
- Ai đang truy cập hệ thống
- Hệ thống đang làm gì
- Các cảnh báo quan trọng

**Ví dụ đơn giản:** Thay vì dùng `console.log()`, ta dùng Logger để có nhiều tính năng hơn.

---

## Tại sao cần Logger?

### ❌ **Vấn đề với console.log():**
```javascript
// Cách cũ - KHÔNG NÊN
console.log("User logged in");  // In ra màn hình rồi... mất!
console.log(error);              // Không biết lỗi lúc nào
```

### ✅ **Lợi ích của Logger:**
```javascript
// Cách mới - RECOMMENDED
Logger.info("User logged in", { userId: 123 });  // Lưu vào file, có timestamp
Logger.error("Database connection failed", error); // Lưu stack trace đầy đủ
```

**Lợi ích:**
- 📁 Lưu vào file, xem lại được
- ⏰ Có timestamp chính xác
- 🎨 Có màu sắc dễ đọc (development)
- 📊 Phân loại theo mức độ quan trọng
- 🔄 Tự động xóa file cũ
- 🔍 Dễ tìm kiếm và phân tích

---

## Cách sử dụng cơ bản

### 1️⃣ **Import Logger:**
```typescript
import { Logger } from "@/utils/logger";
// hoặc
import Logger from "@/utils/logger";
```

### 2️⃣ **Các method cơ bản:**

```typescript
// Ghi lỗi nghiêm trọng
Logger.error("Payment failed", error);

// Cảnh báo
Logger.warn("Low memory", { available: "100MB" });

// Thông tin chung
Logger.info("Server started", { port: 3000 });

// Debug (chỉ hiện khi development)
Logger.debug("Variable value", { user: userData });

// HTTP requests (tự động từ Morgan)
Logger.http("GET /api/users 200");
```

---

## Các cấp độ log

### 📊 **5 Cấp độ (từ quan trọng nhất đến ít quan trọng):**

| Level | Màu | Khi nào dùng | Ví dụ |
|-------|-----|--------------|-------|
| 🔴 **error** | Đỏ | Lỗi nghiêm trọng, cần xử lý ngay | Database crash, Payment failed |
| 🟡 **warn** | Vàng | Cảnh báo, cần chú ý | Memory cao, API slow |
| 🟢 **info** | Xanh lá | Thông tin quan trọng | Server started, User registered |
| 🟣 **http** | Tím | HTTP requests | GET, POST requests |
| ⚪ **debug** | Trắng | Debug, development only | Variable values, Function calls |

### 💡 **Cách nhớ:**
- **Error**: "Ôi không! Có gì đó hỏng!" 🚨
- **Warn**: "Hmm, cần chú ý điều này" ⚠️
- **Info**: "FYI - Điều này vừa xảy ra" ℹ️
- **HTTP**: "Ai đó vừa gọi API" 🌐
- **Debug**: "Chi tiết để debug" 🔍

---

## Nơi lưu trữ logs

### 📁 **Cấu trúc thư mục logs:**
```
your-project/
└── logs/
    ├── error-2024-01-15.log    # Chỉ lỗi của ngày 15/01
    ├── error-2024-01-16.log    # Chỉ lỗi của ngày 16/01
    ├── combined-2024-01-15.log # Tất cả logs ngày 15/01
    └── combined-2024-01-16.log # Tất cả logs ngày 16/01
```

### 🔄 **Tự động quản lý:**
- **Error logs**: Giữ 30 ngày
- **Combined logs**: Giữ 14 ngày
- **Max size**: 20MB/file (tự động tạo file mới nếu quá)
- **Tự động xóa**: File cũ tự động bị xóa

### 👀 **Xem logs:**
```bash
# Xem error logs của hôm nay
cat logs/error-2024-01-15.log

# Xem 10 dòng cuối
tail -n 10 logs/combined-2024-01-15.log

# Theo dõi realtime
tail -f logs/combined-2024-01-15.log

# Tìm kiếm
grep "userId:123" logs/combined-2024-01-15.log
```

---

## Tích hợp với Express

### 🌐 **Setup Morgan để log HTTP requests:**

```typescript
// app.ts hoặc server.ts
import express from "express";
import morgan from "morgan";
import { Logger } from "@/utils/logger";

const app = express();

// Tự động log mọi HTTP request
app.use(morgan("combined", {
  stream: Logger.stream
}));

// Giờ mọi request sẽ được log
// GET /api/users → logs/combined-2024-01-15.log
```

### 📝 **Format options cho Morgan:**
```typescript
// Detailed format
morgan("combined", { stream: Logger.stream });
// Output: 127.0.0.1 - - [15/Jan/2024:10:30:45 +0000] "GET /users HTTP/1.1" 200 2358

// Simple format
morgan("dev", { stream: Logger.stream });
// Output: GET /users 200 35ms - 2.3kb

// Custom format
morgan(":method :url :status :response-time ms", { stream: Logger.stream });
// Output: GET /users 200 35ms
```

---

## Best Practices

### ✅ **DO - Nên làm:**

```typescript
// 1. Log với context/metadata
Logger.info("User login", {
  userId: user.id,
  email: user.email,
  ip: req.ip
});

// 2. Log errors với stack trace
try {
  await database.connect();
} catch (error) {
  Logger.error("Database connection failed", error);
}

// 3. Dùng đúng level
Logger.error("Payment failed");        // Critical
Logger.warn("Rate limit approaching"); // Warning
Logger.info("Order created");          // Important info
Logger.debug("Cache miss");            // Debug only

// 4. Log ở đầu và cuối các process quan trọng
Logger.info("Starting database backup");
// ... process ...
Logger.info("Database backup completed", { duration: "5m", size: "2GB" });
```

### ❌ **DON'T - Không nên:**

```typescript
// 1. KHÔNG log sensitive data
Logger.info("User data", {
  password: "123456",     // KHÔNG!
  creditCard: "4111..."   // KHÔNG!
});

// 2. KHÔNG dùng console.log trong production
console.log("Debug info");  // KHÔNG!
Logger.debug("Debug info");  // Dùng cái này

// 3. KHÔNG spam logs
for (let i = 0; i < 10000; i++) {
  Logger.info(`Processing ${i}`);  // KHÔNG! Quá nhiều
}

// 4. KHÔNG bỏ qua error
try {
  risky();
} catch (error) {
  // KHÔNG silent fail
}
```

---

## Troubleshooting

### 🔧 **Các vấn đề thường gặp:**

#### 1. **Không thấy logs trong console?**
```typescript
// Kiểm tra NODE_ENV
process.env.NODE_ENV !== "production"  // Console chỉ hiện khi không phải production
```

#### 2. **Logs folder không tự tạo?**
```bash
# Tạo thủ công
mkdir logs
```

#### 3. **File logs quá lớn?**
```javascript
// Đã được config tự động:
// - maxSize: "20m" → Tự tạo file mới khi > 20MB
// - maxFiles: "14d" → Tự xóa sau 14 ngày
```

#### 4. **Muốn thay đổi log level?**
```bash
# Set trong environment
LOG_LEVEL=debug npm start  # Hiện tất cả
LOG_LEVEL=warn npm start   # Chỉ warn và error
LOG_LEVEL=error npm start  # Chỉ error
```

#### 5. **Muốn disable màu sắc?**
```typescript
// Trong logger.ts, comment out:
// format.colorize({ all: true })
```

---

## 📚 Ví dụ thực tế

### **Authentication Flow:**
```typescript
// auth.service.ts
class AuthService {
  async login(email: string, password: string) {
    Logger.info("Login attempt", { email });

    try {
      const user = await User.findOne({ email });

      if (!user) {
        Logger.warn("Login failed - User not found", { email });
        throw new Error("Invalid credentials");
      }

      if (!bcrypt.compareSync(password, user.password)) {
        Logger.warn("Login failed - Wrong password", { email });
        throw new Error("Invalid credentials");
      }

      const token = jwt.sign({ userId: user.id });
      Logger.info("Login successful", { userId: user.id, email });

      return { user, token };

    } catch (error) {
      Logger.error("Login error", error);
      throw error;
    }
  }
}
```

### **API Error Handler:**
```typescript
// middleware/errorHandler.ts
export function errorHandler(err, req, res, next) {
  // Log error với đầy đủ context
  Logger.error("API Error", {
    error: err,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  res.status(500).json({
    message: "Internal server error",
    // Chỉ show error details khi development
    ...(process.env.NODE_ENV === "development" && { error: err.message })
  });
}
```

---

## 🎯 Tóm tắt

1. **Logger > console.log()** - Luôn luôn!
2. **Dùng đúng level** - error, warn, info, debug
3. **Log với context** - Thêm metadata hữu ích
4. **Không log sensitive data** - Bảo mật là trên hết
5. **Logs tự quản lý** - Tự rotate, tự xóa cũ
6. **Development có màu** - Production có JSON

---

## 📞 Cần giúp đỡ?

- Xem code gốc: `src/utils/logger.ts`
- Winston docs: https://github.com/winstonjs/winston
- Morgan docs: https://github.com/expressjs/morgan

---

*Happy Logging! 🚀*