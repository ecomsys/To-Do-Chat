const express = require("express");
const router = express.Router();
const { uploadFile, clearUploads, downloadFile } = require("../controllers/file.controller");
const { upload } = require("../middlewares/upload.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");

router.post("/upload", requireAuth, upload.single("file"), uploadFile);
router.post("/clear-uploads", requireAuth, clearUploads);
router.get("/download/:filename", downloadFile);

module.exports = router;