const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs"); // <--- ПОДКЛЮЧИЛИ

const rolesPath = path.join(__dirname, "../config/roles.json");

exports.getRoles = () => {
  const data = fs.readFileSync(rolesPath, "utf8");
  return JSON.parse(data);
};

exports.saveRoles = (roles) => {
  fs.writeFileSync(rolesPath, JSON.stringify(roles, null, 2), "utf8");
};

exports.findRole = (roleName) => {
  const roles = this.getRoles();
  return roles[roleName] || null;
};

// Здесь мы добавляем логику проверки с миграцией и хэширование.
// === Проверка пароля + Ленивая миграция ===
exports.validateAndMigratePassword = async (roleName, inputPassword) => {
  const roles = this.getRoles();
  const roleData = roles[roleName];

  if (!roleData) return false;

  // Проверяем, захэширован ли уже пароль (bcrypt хэши всегда начинаются с $2a$ или $2b$)
  const isHashed = roleData.password.startsWith("$2");

  let isMatch = false;

  if (isHashed) {
    // Если захэширован — сравниваем через безопасную функцию bcrypt
    isMatch = await bcrypt.compare(inputPassword, roleData.password);
  } else {
    // Если хранится в чистом виде (СТАРЫЙ ВАРИАНТ) — простое сравнение
    isMatch = inputPassword === roleData.password;

    // МАГИЯ МИГРАЦИИ: Если старый пароль подошел, хэшируем его и перезаписываем!
    if (isMatch) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(inputPassword, salt);
      roles[roleName].password = hashedPassword;
      this.saveRoles(roles);
      console.log(`🔒 Пароль для роли ${roleName} успешно захэширован!`);
    }
  }

  return isMatch;
};