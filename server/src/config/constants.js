// Берем секрет из переменных окружения
const JWT_SECRET = process.env.JWT_SECRET;

// На всякий случай добавим проверку, чтобы приложение не стартовало без ключа
if (!JWT_SECRET) {
  console.error("ОШИБКА: JWT_SECRET не задан в файле .env!");
  process.exit(1); // Убиваем процесс, чтобы сервер не работал без защиты
}

// Если у тебя там есть другие константы (например, ROLE_PASSWORDS), оставь их
// const ROLE_PASSWORDS = { ... };

module.exports = { JWT_SECRET };