const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
require("dotenv").config(); // <-- Не забудь, если еще не подключено

const { socketAuth } = require("./src/middlewares/auth.middleware");
const socketHandler = require("./src/socket/socketHandler");
const authRoutes = require("./src/routes/auth.routes");
const fileRoutes = require("./src/routes/file.routes");
const roleRoutes = require("./src/routes/role.routes");
const turnRoutes = require("./src/routes/turn.routes"); // <--- НАШ НОВЫЙ РОУТ

const app = express();
app.set('trust proxy', true);

const serverHttp = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "https://todochat.ecomsys.ru"
];

const io = new Server(serverHttp, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.set('io', io);

const roleOccupancy = new Map();

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// 4. Подключаем Роуты
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/roles", roleRoutes(io, roleOccupancy));
app.use("/api/turn-credentials", turnRoutes); // для потоковой связи

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