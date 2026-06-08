import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:5001", {
      withCredentials: true, // ВАЖНО: Браузер отправит httpOnly куки при подключении!
    });
  }
  return socket;
};

export const resetSocket = () => {
  socket = null;
};