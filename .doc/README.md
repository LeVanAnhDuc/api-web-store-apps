# 📚 Project Documentation

> **Thư mục chứa tài liệu kỹ thuật chi tiết cho team members**

---

## 📂 Cấu trúc

```
.doc/
├── README.md                 # File này - Giới thiệu về folder
└── nodemon-config.md         # Hướng dẫn chi tiết về Nodemon configuration
```

---

## 🎯 Mục đích

Folder `.doc/` chứa các tài liệu kỹ thuật chi tiết về:

- ⚙️ **Configuration guides**: Giải thích cấu hình của các tools
- 📖 **Best practices**: Hướng dẫn best practices cho team
- 🔧 **Troubleshooting**: Giải pháp cho các vấn đề thường gặp
- 🎓 **Learning resources**: Tài liệu học tập cho newbies

---

## 📖 Tài liệu hiện có

### 1. [Nodemon Configuration Guide](./nodemon-config.md)

**Audience**: Newbie to Senior
**Topics covered**:
- Nodemon là gì và tại sao cần nó
- Giải thích chi tiết từng config option
- So sánh các cấu hình khác nhau
- Troubleshooting common issues
- Best practices

**Khi nào đọc?**
- ✅ Bạn mới join team
- ✅ Bạn muốn hiểu cấu hình Nodemon
- ✅ Gặp issues với Nodemon
- ✅ Muốn tối ưu development workflow

---

## 🚀 Quy tắc đóng góp

### Khi nào tạo tài liệu mới?

Tạo tài liệu khi:
1. Có config phức tạp cần giải thích chi tiết
2. Team members thường xuyên hỏi về cùng một topic
3. Có nhiều options/configurations cần so sánh
4. Cần document best practices cho team

### Format tài liệu

**Template chuẩn:**

```markdown
# [Tool/Feature] Guide

> Brief description
>
> **Level**: Beginner/Intermediate/Senior | **Last updated**: YYYY-MM-DD

## Mục lục
...

## Giới thiệu
- Nó là gì?
- Tại sao cần nó?

## Cấu hình chi tiết
- Giải thích từng option
- Ví dụ cụ thể
- Use cases

## Troubleshooting
- Các vấn đề thường gặp
- Giải pháp

## Best Practices
- DO's and DON'Ts

## FAQ
...
```

### Style guide

- ✅ **Clear và concise**: Giải thích đơn giản, dễ hiểu
- ✅ **Examples**: Nhiều ví dụ thực tế
- ✅ **Visual aids**: Dùng tables, code blocks, emoji
- ✅ **Multiple levels**: Phù hợp cho cả newbie và senior
- ✅ **Updated**: Giữ tài liệu up-to-date

---

## 🔗 Tài liệu liên quan khác

### README.md (root)
- Setup instructions
- Quick start guide
- Available scripts

### `.doc/` (folder này)
- In-depth technical documentation
- Configuration guides
- Best practices

### Code comments
- Inline documentation
- JSDoc comments
- Type definitions

---

## 📝 Naming convention

Tài liệu nên đặt tên theo format:

```
[tool-name]-[type].md
```

**Examples:**
- `nodemon-config.md` - Nodemon configuration
- `eslint-rules.md` - ESLint rules explained
- `docker-setup.md` - Docker setup guide
- `database-migrations.md` - Database migration guide
- `api-conventions.md` - API design conventions

---

## 🎓 Dành cho Newbies

Bạn mới join team? Đọc các docs theo thứ tự:

1. **README.md** (root) - Project overview
2. **nodemon-config.md** - Development workflow
3. [Future docs...] - Các docs khác

---

## 📞 Liên hệ

Có câu hỏi về docs?
- Tạo issue trên GitHub
- Hỏi trong team chat
- Đóng góp improvements qua PR

---

**Happy learning!** 🚀
