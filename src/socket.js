// socket.js
import { io } from "socket.io-client";

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://chat-backend-s009.onrender.com/", {
      transports: ["websocket"],
    });
  }
  return socket;
};
