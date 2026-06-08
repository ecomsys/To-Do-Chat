const roleService = require("../services/role.service");

// Получить список ролей для формы логина (без паролей!)
exports.getPublicRoles = (req, res) => {
  const roles = roleService.getRoles();
  const publicRoles = Object.keys(roles).map(key => ({
    role: key,
    name: roles[key].name
  }));
  res.json(publicRoles);
};

exports.getAdminRoles = (req, res) => {
  const roles = roleService.getRoles();
  const rolesArray = Object.keys(roles).map(key => ({
    role: key,
    password: roles[key].password,
    name: roles[key].name
  }));
  res.json(rolesArray);
};

exports.upsertRole = (req, res) => {
  const { role, password, name } = req.body;
  if (!role || !password) return res.status(400).json({ error: "Укажите роль и пароль" });
  
  const roles = roleService.getRoles();
  roles[role] = { password, name: name || "" };
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