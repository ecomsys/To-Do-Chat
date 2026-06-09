import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    // Убираем хардкод "http://localhost:5001"!
    // Если URL не передан, socket.io автоматически подключается к текущему домену
    // На локалке это будет http://localhost:3000 (и Vite proxy сработает)
    // На проде это будет https://todochat.ecomsys.ru (и Nginx proxy сработает)
    socket = io({
      withCredentials: true, // ВАЖНО: Браузер отправит httpOnly куки при подключении!
    });
  }
  return socket;
};

export const resetSocket = () => {
  socket = null;
};
