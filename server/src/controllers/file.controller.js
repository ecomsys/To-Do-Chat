const path = require("path");
const fs = require("fs");
const { clearUploadDir } = require("../services/file.service");
const uploadDir = path.join(__dirname, "../../uploads");

exports.uploadFile = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Файл не загружен" });
  const originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, name: originalName, type: req.file.mimetype });
};

exports.clearUploads = (req, res) => {
  if (req.user.role !== "Программист") return res.status(403).json({ error: "Доступ запрещён" });
  const deleted = clearUploadDir();
  res.json({ success: true, deleted });
};

exports.downloadFile = (req, res) => {
  const { filename } = req.params;
  const safePattern = /^[a-zA-Z0-9._-]+$/;
  if (!safePattern.test(filename)) return res.status(400).send("Некорректное имя");
  
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("Не найдено");

  let originalName = req.query.original || filename;
  try { originalName = decodeURIComponent(originalName); } catch (e) {}
  originalName = path.basename(originalName);

  res.download(filePath, originalName);
};