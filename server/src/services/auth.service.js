const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/constants");
const roleService = require("./role.service"); // Подключаем сервис ролей

// ДОБАВИЛИ async
exports.verifyCredentials = async (role, password) => {
  const roleData = roleService.findRole(role);
  if (!roleData) return null; // Если роли нет, сразу отказ

  // ЗАМЕНИЛИ СРАВНЕНИЕ НА НАШ НОВЫЙ МЕТОД
  // Он сам проверит пароль, и если это старый текстовый пароль - захэширует его и сохранит
  const isMatch = await roleService.validateAndMigratePassword(role, password);
  
  if (!isMatch) return null;

  return roleData.name || role; // Возвращаем дефолтное имя, если своего нет
};

exports.generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};