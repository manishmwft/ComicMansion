const fs = require("fs");
const path = require("path");

const {
  optimizeImage,
  deleteFileSafe,
} = require("../utils/imageOptimizer");

/**
 * Returns the final optimized output folder
 * based on the Multer field name.
 */
const getOptimizedFolder = (fieldname) => {
  switch (fieldname) {
    case "thumbnail":
      return "public/uploads/comics";

    case "episode_cover":
      return "public/uploads/episodes";

    case "promotion_image":
      return "public/uploads/promotions";

    case "pages":
    case "page":
    case "page_images":
    case "page_image":
      return "public/uploads/pages";

    default:
      return "public/uploads/misc";
  }
};

/**
 * Returns optimization settings
 * based on the uploaded image type.
 */
const getImageOptions = (fieldname) => {
  switch (fieldname) {
    case "thumbnail":
      return {
        width: 600,
        quality: 82,
        format: "webp",
      };

    case "episode_cover":
      return {
        width: 900,
        quality: 82,
        format: "webp",
      };

    case "promotion_image":
      return {
        width: 1200,
        quality: 84,
        format: "webp",
      };

    case "pages":
    case "page":
    case "page_images":
    case "page_image":
      return {
        width: 1400,
        quality: 85,
        format: "webp",
      };

    default:
      return {
        width: 1200,
        quality: 80,
        format: "webp",
      };
  }
};

/**
 * Ensures the destination folder exists
 * before the optimized file is written.
 */
const ensureFolderExists = async (folder) => {
  await fs.promises.mkdir(folder, {
    recursive: true,
  });
};

/**
 * Optimizes one uploaded file.
 */
const optimizeSingleFile = async (file) => {
  if (!file || !file.path) {
    return file;
  }

  const folder = getOptimizedFolder(
    file.fieldname
  );

  await ensureFolderExists(folder);

  const parsed = path.parse(
    file.filename
  );

  const optimizedFileName =
    `${parsed.name}.webp`;

  const optimizedPath = path.join(
    folder,
    optimizedFileName
  );

  const result = await optimizeImage(
    file.path,
    optimizedPath,
    getImageOptions(file.fieldname)
  );

  if (!result || !result.success) {
    console.warn(
      "IMAGE OPTIMIZATION FAILED:",
      {
        fieldname: file.fieldname,
        filename: file.filename,
        path: file.path,
      }
    );

    return file;
  }

  const originalPath = file.path;

  if (
    path.resolve(originalPath) !==
    path.resolve(optimizedPath)
  ) {
    await deleteFileSafe(
      originalPath
    );
  }

  return {
    ...file,
    filename: optimizedFileName,
    path: optimizedPath,
    destination: folder,
    mimetype: "image/webp",
    size:
      result.size ??
      file.size,
    originalOptimized: true,
  };
};

/**
 * Express middleware that optimizes:
 * - req.file
 * - req.files as array
 * - req.files as Multer fields object
 */
const optimizeUploadedImages = async (
  req,
  res,
  next
) => {
  try {
    if (req.file) {
      req.file =
        await optimizeSingleFile(
          req.file
        );
    }

    if (req.files) {
      if (
        Array.isArray(req.files)
      ) {
        req.files =
          await Promise.all(
            req.files.map(
              optimizeSingleFile
            )
          );
      } else {
        for (
          const fieldName of
          Object.keys(req.files)
        ) {
          const files =
            req.files[fieldName];

          if (!Array.isArray(files)) {
            continue;
          }

          req.files[fieldName] =
            await Promise.all(
              files.map(
                optimizeSingleFile
              )
            );
        }
      }
    }

    return next();
  } catch (error) {
    console.error(
      "UPLOAD OPTIMIZATION MIDDLEWARE ERROR:",
      error
    );

    return next(error);
  }
};

module.exports =
  optimizeUploadedImages;