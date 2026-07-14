const path = require("path");
const { optimizeImage, deleteFileSafe } = require("../utils/imageOptimizer");

const getOptimizedFolder = (fieldname) => {
  if (fieldname === "thumbnail") {
    return "public/uploads/comics";
  }

  if (fieldname === "episode_cover") {
    return "public/uploads/episodes";
  }

  if (
    fieldname === "pages" ||
    fieldname === "page" ||
    fieldname === "page_images" ||
    fieldname === "page_image"
  ) {
    return "public/uploads/pages";
  }

  return "public/uploads/misc";
};

const getImageOptions = (fieldname) => {
  if (fieldname === "thumbnail") {
    return {
      width: 600,
      quality: 82,
      format: "webp",
    };
  }

  if (fieldname === "episode_cover") {
    return {
      width: 900,
      quality: 82,
      format: "webp",
    };
  }

  if (
  fieldname === "pages" ||
  fieldname === "page" ||
  fieldname === "page_images" ||
  fieldname === "page_image"
) {
  return {
    width: 1400,
    quality: 85,
    format: "webp",
  };
}

  return {
    width: 1200,
    quality: 80,
    format: "webp",
  };
};

const optimizeSingleFile = async (file) => {
  if (!file || !file.path) return file;

  const folder = getOptimizedFolder(file.fieldname);
  const parsed = path.parse(file.filename);

  const optimizedFileName = `${parsed.name}.webp`;
  const optimizedPath = path.join(folder, optimizedFileName);

  const result = await optimizeImage(
    file.path,
    optimizedPath,
    getImageOptions(file.fieldname)
  );

  if (!result.success) {
    return file;
  }

  await deleteFileSafe(file.path);

  return {
    ...file,
    filename: optimizedFileName,
    path: optimizedPath,
    mimetype: "image/webp",
    originalOptimized: true,
  };
};

const optimizeUploadedImages = async (req, res, next) => {
  try {
    if (req.file) {
      req.file = await optimizeSingleFile(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files = await Promise.all(
          req.files.map((file) => optimizeSingleFile(file))
        );
      } else {
        for (const fieldName of Object.keys(req.files)) {
          req.files[fieldName] = await Promise.all(
            req.files[fieldName].map((file) => optimizeSingleFile(file))
          );
        }
      }
    }

    next();
  } catch (error) {
    console.error("UPLOAD OPTIMIZATION MIDDLEWARE ERROR:", error);
    next(error);
  }
};

module.exports = optimizeUploadedImages;