const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/constants");
const roleService = require("./role.service"); // Подключаем сервис ролей

exports.verifyCredentials = (role, password) => {
  const roleData = roleService.findRole(role);
  if (!roleData || password !== roleData.password) return null;
  return roleData.name || role; // Возвращаем дефолтное имя, если своего нет
};

exports.generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};