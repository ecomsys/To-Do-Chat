const crypto = require("crypto");

const generateTurnCredentials = (req, res) => {
  try {
    // Берем секрет из переменных окружения
    const TURN_SECRET = process.env.TURN_SECRET;
    const TURN_URL = process.env.TURN_URL;

    if (!TURN_SECRET || !TURN_URL) {
      return res.status(500).json({ error: "TURN server not configured" });
    }

    const ttl = 24 * 3600; // 24 часа
    const timestamp = Math.floor(Date.now() / 1000) + ttl;
    
    // req.user подключается благодаря middleware авторизации!
    const username = `${timestamp}:${req.user?.name || 'guest'}`; 

    // Генерируем HMAC-SHA1
    const hmac = crypto.createHmac("sha1", TURN_SECRET);
    hmac.setEncoding("base64");
    hmac.write(username);
    hmac.end();
    
    const password = hmac.read();

    // Отдаем конфиг
    res.json({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: TURN_URL,
          username: username,
          credential: password,
        },
      ],
    });
  } catch (error) {
    console.error("Ошибка генерации TURN ключей:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { generateTurnCredentials };