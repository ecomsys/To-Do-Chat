const roleService = require("../services/role.service");
const bcrypt = require("bcryptjs"); // <--- ПОДКЛЮЧИЛИ

// Тут мы прячем хэши от админки и хэшируем новые пароли при сохранении.

// Получить список ролей для формы логина (без паролей!)
exports.getPublicRoles = (req, res) => {
  const roles = roleService.getRoles();
  const publicRoles = Object.keys(roles).map(key => ({
    role: key,
    name: roles[key].name
  }));
  res.json(publicRoles);
};

// Получить все роли для АДМИНКИ
exports.getAdminRoles = (req, res) => {
  const roles = roleService.getRoles();
  const rolesArray = Object.keys(roles).map(key => ({
    role: key,
    password: "********", // <--- ВАЖНО: Не светим реальные хэши, отправляем маску!
    name: roles[key].name
  }));
  res.json(rolesArray);
};

// Создать/Обновить роль
exports.upsertRole = async (req, res) => {
  const { role, password, name } = req.body;
  if (!role) return res.status(400).json({ error: "Укажите роль" });
  
  const roles = roleService.getRoles();
  const existingRole = roles[role];

  let finalPassword;

  // Если админ не менял пароль (пришел наша маска ********) И роль уже существует
  if (password === "********" && existingRole) {
    finalPassword = existingRole.password; // Оставляем старый пароль (хэш) как есть
  } else if (!password) {
    return res.status(400).json({ error: "Укажите пароль" });
  } else {
    // Админ ввел НОВЫЙ пароль -> ХЭШИРУЕМ ЕГО!
    const salt = await bcrypt.genSalt(10);
    finalPassword = await bcrypt.hash(password, salt);
  }

  roles[role] = { password: finalPassword, name: name || "" };
  roleService.saveRoles(roles);
  
  // ОТПРАВЛЯЕМ СОБЫТИЕ ВСЕМ КЛИЕНТАМ
  const io = req.app.get('io');
  if (io) io.emit("rolesUpdated");
  
  res.json({ success: true, role: roles[role] });
};


exports.deleteRole = (req, res) => {
  const { roleName } = req.params;
  if (roleName === "Программист") return res.status(403).json({ error: "Нельзя удалить главную роль!" });
  
  const roles = roleService.getRoles();
  if (!roles[roleName]) return res.status(404).json({ error: "Роль не найдена" });
  
  delete roles[roleName];
  roleService.saveRoles(roles);
  
  // ОТПРАВЛЯЕМ СОБЫТИЕ ВСЕМ КЛИЕНТАМ
  const io = req.app.get('io');
  if (io) io.emit("rolesUpdated");
  
  res.json({ success: true });
};