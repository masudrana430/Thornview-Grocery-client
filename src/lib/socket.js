import { io } from "socket.io-client";

let socket;

export function getSocket(accessToken) {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"],
      auth: { token: accessToken },
    });
  }
  return socket;
}
