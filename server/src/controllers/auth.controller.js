const {
  verifyCredentials,
  generateToken,
} = require("../services/auth.service");
const roleService = require("../services/role.service"); // Добавили

// 1. ДОБАВИЛИ async
exports.login = async (req, res) => {
  const { role, password, name } = req.body;

  // 2. ДОБАВИЛИ await, чтобы дождаться результата проверки bcrypt!
  const isVerified = await verifyCredentials(role, password);

  if (!isVerified) {
    return res
      .status(401)
      .json({ error: `Неверный пароль для роли "${role}"` });
  }

  // Токен генерируем только если await пропустил нас дальше
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
  // Проверяем, не удалили ли роль пользователя из JSON
  const roleData = roleService.findRole(req.user.role);
  if (!roleData) {
    // Если роль удалена, очищаем куку и отправляем ошибку
    res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
    return res.status(401).json({ error: "Роль больше не существует" });
  }
  res.json({ role: req.user.role, name: req.user.name });
};

// Выход (очищаем куку)
exports.logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  res.json({ success: true });
};
