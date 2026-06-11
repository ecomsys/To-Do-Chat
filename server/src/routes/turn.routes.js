const express = require("express");
const router = express.Router();

// Импортируем контроллер
const { generateTurnCredentials } = require("../controllers/turn.controller");

// ИМПОРТИРУЙ ТВОЙ MIDDLEWARE ДЛЯ АВТОРИЗАЦИИ HTTP-ЗАПРОСОВ

const { requireAuth } = require("../middlewares/auth.middleware");

// Защищаем роут! Только авторизованные юзеры получат ключи.
router.get("/", requireAuth, generateTurnCredentials);

module.exports = router;
