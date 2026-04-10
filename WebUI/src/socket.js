import { io } from "socket.io-client";

let socket;

export const connectSocket = (userId) => {
  if (socket && socket.connected) return; // 🔥 prevent duplicate

  socket = io(import.meta.env.VITE_API_BASE_URL, {
    transports: ["websocket"], // 🔥 force websocket (fix polling issue)
    reconnection: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    socket.emit("join", userId);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket error:", err.message);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });
};

export const getSocket = () => socket;