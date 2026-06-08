const { verifyToken } = require("../services/auth.service");
const cookie = require("cookie");

// Middleware для обычных HTTP-роутов
exports.requireAuth = (req, res, next) => {
  try {
    // Токен теперь берем из cookies
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Не авторизован" });
    
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(403).json({ error: "Неверный или просроченный токен" });
  }
};

// Middleware для Socket.IO
exports.socketAuth = (socket, next) => {
  try {
    // В Socket.IO куки приходят в заголовке, парсим их
    const cookies = cookie.parse(socket.request.headers.cookie || '');
    const token = cookies.token;
    
    if (!token) return next(new Error("Authentication error"));
    
    socket.user = verifyToken(token);
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
};