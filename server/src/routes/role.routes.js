const express = require("express");
const router = express.Router();
const {
  getPublicRoles,
  getAdminRoles,
  upsertRole,
} = require("../controllers/role.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const roleService = require("../services/role.service");

// Принимаем io и roleOccupancy
module.exports = (io, roleOccupancy) => {
  // Публичный роут
  router.get("/public", getPublicRoles);

  // Получить все роли (админ)
  router.get(
    "/admin",
    requireAuth,
    (req, res, next) => {
      if (req.user.role !== "Программист")
        return res.status(403).json({ error: "Доступ запрещен" });
      next();
    },
    getAdminRoles,
  );

  // Создать/обновить роль
  router.post(
    "/admin",
    requireAuth,
    (req, res, next) => {
      if (req.user.role !== "Программист")
        return res.status(403).json({ error: "Доступ запрещен" });
      next();
    },
    upsertRole,
  );

  // УДАЛИТЬ РОЛЬ (Тут магия)
  router.delete("/admin/:roleName", requireAuth, (req, res, next) => {
    if (req.user.role !== "Программист")
      return res.status(403).json({ error: "Доступ запрещен" });

    const { roleName } = req.params;
    if (roleName === "Программист")
      return res.status(403).json({ error: "Нельзя удалить главную роль!" });

    const roles = roleService.getRoles();
    if (!roles[roleName])
      return res.status(404).json({ error: "Роль не найдена" });

    // 1. Удаляем из JSON
    delete roles[roleName];
    roleService.saveRoles(roles);

    // 2. Кикаем пользователя из сокетов, если он онлайн
    const socketId = roleOccupancy.get(roleName);
    if (socketId) {
      const targetSocket = io.sockets.sockets.get(socketId);
      if (targetSocket) {
        // Отправляем ему причину кика
        targetSocket.emit("roleDeleted", {
          message: `Роль "${roleName}" была удалена администратором.`,
        });
        // Отключаем
        targetSocket.disconnect(true);
      }
      roleOccupancy.delete(roleName);
    }

    res.json({ success: true });
  });

  return router;
};
