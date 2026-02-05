// src/services/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

let socket = null;

function getToken() {
  return localStorage.getItem("accessToken") || "";
}

export function connectSocket() {
  if (!SOCKET_URL) {
    console.warn("VITE_SOCKET_URL is missing");
    return null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
    });

    socket.on("connect", () => console.log("✅ socket connected:", socket.id));
    socket.on("disconnect", (r) => console.log("⚠️ socket disconnected:", r));
    socket.on("connect_error", (err) => console.log("❌ socket connect_error:", err?.message || err));
  }

  // ✅ IMPORTANT: send token in handshake
  socket.auth = { token: getToken() };
  socket.connect();

  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
}
