const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());


// === Папка для загруженных файлов ===
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));

// === Multer ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// === Обработка загрузки файла ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Обработчик загрузки файла
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });

  // 🔧 ИСПРАВЛЕНИЕ: Multer прочитал UTF-8 байты как latin1.
  // Берём эти "испорченные" символы, превращаем обратно в исходные байты (через latin1),
  // а затем декодируем их уже правильно как UTF-8.
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

  const fileUrl = `/uploads/${req.file.filename}`;
  // Отдаём имя файла как есть — JSON/Socket.IO отлично справятся с кириллицей
  res.json({ url: fileUrl, name: originalName, type: req.file.mimetype });
});

// === Сокеты ===
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

// Хранилище
const users = new Map();
const roleOccupancy = new Map();
const messageHistory = [];
const MAX_HISTORY = 100;

io.on("connection", (socket) => {
  console.log("Пользователь подключился:", socket.id);

  socket.on("userJoin", ({ role, name }) => {
    if (roleOccupancy.has(role) && roleOccupancy.get(role) !== socket.id) {
      socket.emit("roleTaken", { message: `Роль "${role}" уже занята.` });
      return;
    }
    roleOccupancy.set(role, socket.id);
    const user = { id: socket.id, role, name: name || role };
    users.set(socket.id, user);
    io.emit("usersList", Array.from(users.values()));
    socket.emit("messageHistory", messageHistory);
    socket.emit("joined", { role, name });
  });

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

  socket.on("typing", ({ isTyping }) => {
    socket.broadcast.emit("userTyping", { userId: socket.id, isTyping });
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      if (roleOccupancy.get(user.role) === socket.id)
        roleOccupancy.delete(user.role);
      users.delete(socket.id);
      io.emit("usersList", Array.from(users.values()));
    }
    console.log("Пользователь отключился:", socket.id);
  });
});

// === Раздача статики собранного клиента (продакшн) ===
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

const PORT = 5000;
serverHttp.listen(PORT, () =>
  console.log(`Сервер чата запущен на порту ${PORT}`),
);
