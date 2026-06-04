import io from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const isDev = import.meta.env.DEV;
    const url = isDev ? 'http://localhost:5000' : undefined;
    socket = io(url, {
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const resetSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};