import { Server } from "socket.io";
import http, { get } from "http";

let io; // 👈 shared instance
export const onlineUsers = {}; // 👈 shared map

export const initSocket = (app) => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://192.168.1.18:5173",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    

    const { userId } = socket.handshake.query;
    console.log("new user connected:", socket.id , " user_id: ",userId);

    if (!userId) { socket.disconnect(); return; }

    //Mark User Online
    onlineUsers[userId] = { socketId: socket.id, };
    io.emit("getOnlineUsers", Object.keys(onlineUsers));

    socket.on("disconnect", () => {
      //Mark User Offline
      delete onlineUsers[userId];
      io.emit("getOnlineUsers", Object.keys(onlineUsers));
    });

    // when user starts typing
    socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers[receiverId]?.socketId;
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers[receiverId]?.socketId;
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId });
    }
  });


  });

  return { io, server };
};

// ✅ Proper getters
export const getIo = () => io;

export const getReceiverSocketId = (userId) =>
  onlineUsers[userId]?.socketId;
