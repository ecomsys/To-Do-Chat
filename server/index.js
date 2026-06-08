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

const app = express();

// Core Middlewares
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // ВАЖНО: credentials!
app.use(express.json());
app.use(cookieParser()); // Парсим куки

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

// Static uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));

// Client static (prod)
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("/{*splat}", (req, res) =>
    res.sendFile(path.join(clientDistPath, "index.html")),
  );
}

// Server & Socket Setup
const serverHttp = http.createServer(app);
const io = new Server(serverHttp, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(socketAuth); // Подключаем проверку кук для сокетов
socketHandler(io); // Передаем io в хендлер

const PORT = 5001;
serverHttp.listen(PORT, () =>
  console.log(`Сервер запущен на http://localhost:${PORT}`),
);
