const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const getUploadFolder = (fieldname) => {
  if (fieldname === "thumbnail") {
    return "public/uploads/comics";
  }

  if (fieldname === "episode_cover") {
    return "public/uploads/episodes";
  }

  if (fieldname === "pages" || fieldname === "page") {
    return "public/uploads/pages";
  }
  if (fieldname === "promotion_image") {
    return "public/uploads/promotions";
  }

  return "public/uploads/misc";
};

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = getUploadFolder(file.fieldname);
    ensureDir(folder);
    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error("Invalid file type. Only JPG, PNG, and WEBP images are allowed."),
      false
    );
  }

  if (!allowedExtensions.includes(ext)) {
    return cb(
      new Error("Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed."),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 30,
  },
});

module.exports = upload;