import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import type { Request, RequestHandler } from "express";
import { BadRequestError } from "@/config/responses/error";
import { CONTACT_CONFIG, USER_CONFIG, BLOG_CONFIG } from "@/constants/config";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".pdf",
  ".doc",
  ".docx"
]);

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    const date = new Date().toISOString().slice(0, 10);
    const uploadDir = path.join(process.cwd(), "uploads", "contacts", date);

    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    cb(
      new BadRequestError(
        "contactAdmin:errors.fileTypeNotSupported",
        "FILE_TYPE_NOT_SUPPORTED"
      )
    );
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: CONTACT_CONFIG.MAX_FILE_SIZE_BYTES,
    files: CONTACT_CONFIG.MAX_ATTACHMENTS
  }
});

// Detect actual MIME type from file magic bytes (first 12 bytes).
// Multer's file.mimetype comes from the HTTP Content-Type header and can be
// spoofed by the client. Reading the actual file bytes prevents MIME faking.
function detectImageMimeType(filePath: string): string | null {
  try {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(12);
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    // PNG: 89 50 4E 47
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }
    // GIF: 47 49 46 38 (GIF8)
    if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return "image/gif";
    }
    // WEBP: RIFF at 0-3, WEBP at 8-11
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return "image/webp";
    }
    // AVIF: ISO BMFF 'ftyp' box at offset 4, brand at offset 8.
    // Box size (bytes 0–3, big-endian uint32) must be >= 16 (minimum ftyp box size).
    const boxSize = buffer.readUInt32BE(0);
    if (
      boxSize >= 16 &&
      buffer[4] === 0x66 &&
      buffer[5] === 0x74 &&
      buffer[6] === 0x79 &&
      buffer[7] === 0x70
    ) {
      const brand = buffer.slice(8, 12).toString("ascii");
      if (["avif", "avis", "MA1B", "MA1A"].includes(brand)) {
        return "image/avif";
      }
    }

    return null;
  } catch {
    return null;
  }
}

const AVATAR_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif"
]);

const AVATAR_ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif"
]);

const avatarStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    const uploadDir = path.join(process.cwd(), USER_CONFIG.AVATAR_UPLOAD_DIR);
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const avatarFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    !AVATAR_ALLOWED_MIME_TYPES.has(file.mimetype) ||
    !AVATAR_ALLOWED_EXTENSIONS.has(ext)
  ) {
    cb(
      new BadRequestError(
        "user:errors.fileTypeNotSupported",
        "FILE_TYPE_NOT_SUPPORTED"
      )
    );
    return;
  }

  cb(null, true);
};

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: USER_CONFIG.AVATAR_MAX_SIZE_BYTES,
    files: 1
  }
});

export const uploadAvatar: RequestHandler = (req, res, next) => {
  avatarUpload.single("avatar")(req, res, (err) => {
    if (!err) {
      // Validate actual file content via magic bytes — prevents MIME type spoofing
      if (req.file) {
        const actualMimeType = detectImageMimeType(req.file.path);
        if (!actualMimeType || !AVATAR_ALLOWED_MIME_TYPES.has(actualMimeType)) {
          fs.unlink(req.file.path, () => {});
          next(
            new BadRequestError(
              "user:errors.fileTypeNotSupported",
              "FILE_TYPE_NOT_SUPPORTED"
            )
          );
          return;
        }
      }
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(new BadRequestError("user:errors.fileTooLarge", "FILE_TOO_LARGE"));
        return;
      }
      next(
        new BadRequestError("user:errors.fileUploadFailed", "FILE_UPLOAD_ERROR")
      );
      return;
    }

    next(err);
  });
};

const BLOG_COVER_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif"
]);

const BLOG_COVER_ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif"
]);

const blogCoverStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    const date = new Date().toISOString().slice(0, 10);
    const uploadDir = path.join(
      process.cwd(),
      BLOG_CONFIG.COVER_UPLOAD_DIR,
      date
    );
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const blogCoverFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    !BLOG_COVER_ALLOWED_MIME_TYPES.has(file.mimetype) ||
    !BLOG_COVER_ALLOWED_EXTENSIONS.has(ext)
  ) {
    cb(
      new BadRequestError(
        "blog:errors.fileTypeNotSupported",
        "FILE_TYPE_NOT_SUPPORTED"
      )
    );
    return;
  }

  cb(null, true);
};

const blogCoverUpload = multer({
  storage: blogCoverStorage,
  fileFilter: blogCoverFileFilter,
  limits: {
    fileSize: BLOG_CONFIG.COVER_MAX_SIZE_BYTES,
    files: 1
  }
});

export const uploadBlogCover: RequestHandler = (req, res, next) => {
  blogCoverUpload.single("coverImage")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(new BadRequestError("blog:errors.fileTooLarge", "FILE_TOO_LARGE"));
        return;
      }
      next(
        new BadRequestError("blog:errors.fileUploadFailed", "FILE_UPLOAD_ERROR")
      );
      return;
    }

    next(err);
  });
};

export const uploadContactFiles: RequestHandler = (req, res, next) => {
  upload.array("attachments", CONTACT_CONFIG.MAX_ATTACHMENTS)(
    req,
    res,
    (err) => {
      if (!err) {
        next();
        return;
      }

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          next(
            new BadRequestError(
              "contactAdmin:errors.fileTooLarge",
              "FILE_TOO_LARGE"
            )
          );
          return;
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          next(
            new BadRequestError(
              "contactAdmin:errors.maxFilesExceeded",
              "MAX_FILES_EXCEEDED"
            )
          );
          return;
        }
        next(
          new BadRequestError(
            "contactAdmin:errors.fileUploadFailed",
            "FILE_UPLOAD_ERROR"
          )
        );
        return;
      }

      next(err);
    }
  );
};
