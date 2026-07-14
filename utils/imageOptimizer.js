const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const optimizeImage = async (
  inputPath,
  outputPath,
  options = {}
) => {
  const {
    width = null,
    height = null,
    quality = 80,
    format = "webp",
  } = options;

  try {
    let transformer = sharp(inputPath);

    if (width || height) {
      transformer = transformer.resize({
        width,
        height,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (format === "webp") {
      await transformer
        .webp({
          quality,
        })
        .toFile(outputPath);
    } else if (format === "jpeg" || format === "jpg") {
      await transformer
        .jpeg({
          quality,
        })
        .toFile(outputPath);
    } else if (format === "png") {
      await transformer
        .png({
          quality,
        })
        .toFile(outputPath);
    } else {
      await transformer.toFile(outputPath);
    }

    return {
      success: true,
      outputPath,
    };
  } catch (error) {
    console.error("IMAGE OPTIMIZATION ERROR:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

const deleteFileSafe = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("DELETE FILE ERROR:", error);
  }
};

module.exports = {
  optimizeImage,
  deleteFileSafe,
};