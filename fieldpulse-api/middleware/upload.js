const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max file size for high-res mobile photos
  fileFilter: (_req, file, cb) => {
    const allowedExts = /jpeg|jpg|png|gif|webp|pdf|heic|heif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowed = allowedExts.test(ext) || file.mimetype.startsWith("image/");
    cb(null, isAllowed);
  },
});

module.exports = upload;
