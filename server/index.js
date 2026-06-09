const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

const { socketAuth } = require("./src/middlewares/auth.middleware");
const socketHandler = require("./src/socket/socketHandler");
const authRoutes = require("./src/routes/auth.routes");
const fileRoutes = require("./src/routes/file.routes");
const roleRoutes = require("./src/routes/role.routes");

const app = express();

// 1. Создаем HTTP сервер и Socket.IO ПЕРВЫМ ДЕЛОМ
const serverHttp = http.createServer(app);

// Массив разрешенных адресов
const allowedOrigins = [
  "http://localhost:3000", // Для локалки
  "https://todochat.ecomsys.ru" // Для прода
];

const io = new Server(serverHttp, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.set('io', io);

// 2. Создаем общую мапу занятых ролей
const roleOccupancy = new Map();

// 3. Подключаем Middlewares (ОБЯЗАТЕЛЬНО ДО РОУТОВ!)
app.use(cors({ origin: allowedOrigins, credentials: true })); // Добавил CORS для HTTP
app.use(express.json()); // ВАЖНО: До роутов, чтобы req.body работал
app.use(cookieParser());

// 4. Подключаем Роуты (теперь io и roleOccupancy существуют)
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/roles", roleRoutes(io, roleOccupancy)); // Убрал хак со stack.filter, всё работает и так!

// 5. Статика
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));

const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("/{*splat}", (req, res) =>
    res.sendFile(path.join(clientDistPath, "index.html"))
  );
}

// 6. Подключаем Socket.IO
io.use(socketAuth);
socketHandler(io, roleOccupancy);

// 7. Запуск
const PORT = 5001;
serverHttp.listen(PORT, () =>
  console.log(`Сервер запущен на http://localhost:${PORT}`)
);