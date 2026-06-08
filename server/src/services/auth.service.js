const jwt = require("jsonwebtoken");
const { ROLE_PASSWORDS, JWT_SECRET } = require("../config/constants");

exports.verifyCredentials = (role, password) => {
  const expectedPassword = ROLE_PASSWORDS[role];
  if (!expectedPassword || password !== expectedPassword) return null;
  return true;
};

exports.generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};