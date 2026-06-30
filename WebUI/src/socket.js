import { io } from "socket.io-client";

let socket;

export const connectSocket = (user) => {
  if (socket && socket.connected) return;

  socket = io(import.meta.env.VITE_API_BASE_URL, {
    transports: ["websocket"],
    reconnection: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    socket.emit("join", {
      userId: user._id,
      role: user.role,
      departments: (user.employee?.departments || []).map((d) => d._id || d),
    });
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket error:", err.message);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });
};

export const getSocket = () => socket;
