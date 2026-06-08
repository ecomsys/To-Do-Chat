const { ROLE_PASSWORDS } = require("../config/constants");

module.exports = (io) => {
  const users = new Map();
  const roleOccupancy = new Map();
  const messageHistory = [];
  const MAX_HISTORY = 100;

  io.on("connection", (socket) => {
    const { role, name } = socket.user;

    socket.on("userJoin", () => {
      if (roleOccupancy.has(role) && roleOccupancy.get(role) !== socket.id) {
        return socket.emit("roleTaken", { message: `Роль "${role}" уже занята.` });
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
      const isAuthor = messageHistory[msgIndex].userId === socket.id;
      const isProgrammer = role === "Программист";
      if (!isAuthor && !isProgrammer) return;
      messageHistory.splice(msgIndex, 1);
      io.emit("messageDeleted", { messageId });
    });

    socket.on("chatMessage", ({ message }) => {
      const msgData = { id: Date.now(), userId: socket.id, role, name, message, timestamp: new Date().toISOString(), type: "text" };
      messageHistory.push(msgData);
      if (messageHistory.length > MAX_HISTORY) messageHistory.shift();
      io.emit("message", msgData);
    });

    socket.on("chatFile", ({ name: fileName, type, url }) => {
      const msgData = { id: Date.now(), userId: socket.id, role, name, fileName, fileType: type, fileUrl: url, timestamp: new Date().toISOString(), type: "file" };
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
        if (roleOccupancy.get(user.role) === socket.id) roleOccupancy.delete(user.role);
        users.delete(socket.id);
        io.emit("usersList", Array.from(users.values()));
      }
    });
  });
};