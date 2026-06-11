const { ROLE_PASSWORDS } = require("../config/constants");

module.exports = (io, roleOccupancy) => {
  const users = new Map();
  const messageHistory = [];
  const MAX_HISTORY = 100;

  // === Хранилище активных звонков для обработки дисконнектов ===
  const activeCalls = new Map();

  io.on("connection", (socket) => {
    const { role, name } = socket.user;

    socket.on("userJoin", () => {
      if (roleOccupancy.has(role) && roleOccupancy.get(role) !== socket.id) {
        return socket.emit("roleTaken", {
          message: `Роль "${role}" уже занята.`,
        });
      }
      roleOccupancy.set(role, socket.id);
      const user = { id: socket.id, role, name };
      users.set(socket.id, user);
      io.emit("usersList", Array.from(users.values()));
      socket.emit("messageHistory", messageHistory);
      socket.emit("joined", { role, name });
    });

    socket.on("clearChat", () => {
      if (role !== "Программист") return;
      messageHistory.length = 0;
      io.emit("messageHistory", []);
      io.emit("chatCleared", { by: name });
    });

    socket.on("deleteMessage", ({ messageId }) => {
      const msgIndex = messageHistory.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;
      
      // Сравниваем роль автора с текущей ролью, а не socket.id
      // Так как одна роль = один человек, это работает на 100% надежно
      const isAuthor = messageHistory[msgIndex].role === role; 
      const isProgrammer = role === "Программист";
      
      if (!isAuthor && !isProgrammer) return;
      messageHistory.splice(msgIndex, 1);
      io.emit("messageDeleted", { messageId });
    });

    socket.on("editMessage", ({ messageId, newText }) => {
      const msgIndex = messageHistory.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;

      // Проверяем права: только автор может редактировать, и только текст
      const isAuthor = messageHistory[msgIndex].role === role;
      const isText = messageHistory[msgIndex].type === "text";
      
      if (!isAuthor || !isText) return;

      // Обновляем текст и ставим флажок
      messageHistory[msgIndex].message = newText;
      messageHistory[msgIndex].isEdited = true;
      
      // Отправляем обновленное сообщение всем
      io.emit("messageEdited", messageHistory[msgIndex]);
    });

    // === ВИДЕО СВЯЗЬ (Сигнализация) ===

    socket.on("call-user", ({ targetSocketId, offer, callType }) => {
      io.to(targetSocketId).emit("incoming-call", {
        from: socket.id,
        offer,
        callerName: name,
        callerRole: role,
        callType: callType || "video",
      });
    });

    socket.on("answer-call", ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit("call-answered", { from: socket.id, answer });

      activeCalls.set(socket.id, targetSocketId);
      activeCalls.set(targetSocketId, socket.id);
    });

    socket.on("ice-candidate", ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit("ice-candidate", {
        from: socket.id,
        candidate,
      });
    });

    socket.on("end-call", ({ targetSocketId }) => {
      io.to(targetSocketId).emit("call-ended");

      activeCalls.delete(socket.id);
      activeCalls.delete(targetSocketId);
    });

    socket.on("chatMessage", ({ message, replyTo }) => {
      const msgData = {
        id: Date.now(),
        userId: socket.id,
        role,
        name,
        message,
        replyTo: replyTo || null,
        timestamp: new Date().toISOString(),
        type: "text",
      };
      messageHistory.push(msgData);
      if (messageHistory.length > MAX_HISTORY) messageHistory.shift();
      io.emit("message", msgData);
    });

    socket.on("chatFile", ({ name: fileName, type, url, replyTo }) => {
      const msgData = {
        id: Date.now(),
        userId: socket.id,
        role,
        name,
        fileName,
        fileType: type,
        fileUrl: url,
        replyTo: replyTo || null,
        timestamp: new Date().toISOString(),
        type: "file",
      };
      messageHistory.push(msgData);
      if (messageHistory.length > MAX_HISTORY) messageHistory.shift();
      io.emit("message", msgData);
    });

    socket.on("typing", ({ isTyping }) => {
      socket.broadcast.emit("userTyping", { userId: socket.id, isTyping });
    });

    socket.on("disconnect", () => {
      const user = users.get(socket.id);
      if (user) {
        if (roleOccupancy.get(user.role) === socket.id)
          roleOccupancy.delete(user.role);
        users.delete(socket.id);
        io.emit("usersList", Array.from(users.values()));
      }

      if (activeCalls.has(socket.id)) {
        const partnerSocketId = activeCalls.get(socket.id);
        io.to(partnerSocketId).emit("call-ended");
        activeCalls.delete(socket.id);
        activeCalls.delete(partnerSocketId);
      }
    });
  });
};