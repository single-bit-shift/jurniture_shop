const multer = require("multer");

const storage = multer.memoryStorage(); // IMPORTANT for Cloudinary

const upload = multer({ storage });

module.exports = upload;