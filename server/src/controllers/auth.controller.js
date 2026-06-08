const { verifyCredentials, generateToken } = require("../services/auth.service");

exports.login = (req, res) => {
  const { role, password, name } = req.body;
  
  if (!verifyCredentials(role, password)) {
    return res.status(401).json({ error: `Неверный пароль для роли "${role}"` });
  }

  const token = generateToken({ role, name: name || role });

  // Устанавливаем httpOnly куку
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // На проде только HTTPS
    sameSite: "lax", // Защита от CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
  });

  res.json({ role, name: name || role });
};

// Эндпоинт для проверки сессии при перезагрузке страницы
exports.me = (req, res) => {
  // req.user уже добавлен в middleware requireAuth
  res.json({ role: req.user.role, name: req.user.name });
};

// Выход (очищаем куку)
exports.logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  res.json({ success: true });
};