import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import type { Request, RequestHandler } from "express";
import { BadRequestError } from "@/config/responses/error";
import { CONTACT_CONFIG, USER_CONFIG } from "@/constants/config";

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
