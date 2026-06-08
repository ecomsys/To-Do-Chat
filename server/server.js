const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5001;

// === Конфигурация ===
const ROLE_PASSWORDS = {
  Дизайнер: "designer_01",
  Заказчик: "zakazchik_01",
  Программист: "programmer_01",
};

const MAX_HISTORY = 100;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const uploadDir = path.join(__dirname, "uploads");

// === Инициализация папки для загрузок ===
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_FILE_SIZE }));
app.use("/uploads", express.static(uploadDir)); // Раздача статики

// === Настройка Multer (загрузка файлов) ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

// === API Роуты ===

// Загрузка файла на сервер
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Файл не загружен" });

  // Исправление кодировки кириллицы: Multer парсит имена как latin1, конвертируем обратно в utf-8
  const originalName = Buffer.from(req.file.originalname, "latin1").toString(
    "utf8",
  );
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  res.json({ url: fileUrl, name: originalName, type: req.file.mimetype });
});

// Очистка папки uploads (только для Программиста)
app.post("/clear-uploads", (req, res) => {
  const { role, password } = req.body;
  if (role !== "Программист" || password !== ROLE_PASSWORDS[role]) {
    return res.status(403).json({ error: "Доступ запрещён" });
  }

  try {
    const files = fs.readdirSync(uploadDir);
    let deleted = 0;

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    }

    console.log(`Папка uploads очищена: удалено ${deleted} файлов`);
    res.json({ success: true, deleted });
  } catch (err) {
    console.error("Ошибка очистки uploads:", err);
    res.status(500).json({ error: "Ошибка при очистке" });
  }
});

// Принудительное скачивание файла (с оригинальным именем)
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;

  // Защита от path traversal (допускаем только безопасные символы)
  const safePattern = /^[a-zA-Z0-9._-]+$/;
  if (!safePattern.test(filename))
    return res.status(400).send("Некорректное имя файла");

  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("Файл не найден");

  // Восстановление оригинального имени из query-параметра
  let originalName = req.query.original || filename;
  try {
    originalName = decodeURIComponent(originalName);
  } catch (e) {
    /* оставляем как есть */
  }
  originalName = path.basename(originalName); // Отсекаем возможные пути, оставляем только имя

  // Express сам определит MIME-тип и выставит заголовки для скачивания
  res.download(filePath, originalName, (err) => {
    if (err) console.error("Ошибка при скачивании файла:", err);
  });
});

// === WebSocket (Socket.IO) ===
const serverHttp = http.createServer(app);
const io = new Server(serverHttp, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://todochat.ecomsys.ru"
        : "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Хранилище состояния
const users = new Map();
const roleOccupancy = new Map();
const messageHistory = [];

io.on("connection", (socket) => {
  console.log("Подключение:", socket.id);

  // --- Авторизация и роли ---
  socket.on("userJoin", ({ role, name }) => {
    if (roleOccupancy.has(role) && roleOccupancy.get(role) !== socket.id) {
      return socket.emit("roleTaken", {
        message: `Роль "${role}" уже занята.`,
      });
    }

    roleOccupancy.set(role, socket.id);
    const user = { id: socket.id, role, name: name || role };
    users.set(socket.id, user);

    io.emit("usersList", Array.from(users.values()));
    socket.emit("messageHistory", messageHistory);
    socket.emit("joined", { role, name });
  });

  // --- Очистка чата ---
  socket.on("clearChat", () => {
    const user = users.get(socket.id);
    if (!user || user.role !== "Программист")
      return console.warn(`Попытка очистки от: ${user?.role}`);

    messageHistory.length = 0;
    io.emit("messageHistory", []);
    io.emit("chatCleared", { by: user.name });
    console.log(`Чат очищен: ${user.name}`);
  });

  // --- Сообщения ---
  socket.on("chatMessage", ({ message }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const msgData = {
      id: Date.now(),
      userId: socket.id,
      role: user.role,
      name: user.name,
      message,
      timestamp: new Date().toISOString(),
      type: "text",
    };

    messageHistory.push(msgData);
    if (messageHistory.length > MAX_HISTORY) messageHistory.shift();
    io.emit("message", msgData);
  });

  socket.on("chatFile", ({ name, type, url }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const msgData = {
      id: Date.now(),
      userId: socket.id,
      role: user.role,
      name: user.name,
      fileName: name,
      fileType: type,
      fileUrl: url,
      timestamp: new Date().toISOString(),
      type: "file",
    };

    messageHistory.push(msgData);
    if (messageHistory.length > MAX_HISTORY) messageHistory.shift();
    io.emit("message", msgData);
  });

  // --- Индикатор набора текста ---
  socket.on("typing", ({ isTyping }) => {
    socket.broadcast.emit("userTyping", { userId: socket.id, isTyping });
  });

  // --- Отключение ---
  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      if (roleOccupancy.get(user.role) === socket.id)
        roleOccupancy.delete(user.role);
      users.delete(socket.id);
      io.emit("usersList", Array.from(users.values()));
    }
    console.log("Отключение:", socket.id);
  });
});

// === Раздача статики клиента (Продакшн) ===
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// === Запуск сервера ===
serverHttp.listen(PORT, () =>
  console.log(`Сервер запущен на http://localhost:${PORT}`),
);
