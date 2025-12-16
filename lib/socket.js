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
        "http://192.168.1.16:5173",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("new user connected:", socket.id);

    const { userId } = socket.handshake.query;

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
  socket.on("typing", ({ chatId }) => {
    // send typing status to other users in this chat
    const chatUsers = getChatUsers(chatId).filter(u => u.userId !== userId);
    chatUsers.forEach(u => {
      const receiverSocket = onlineUsers[u.userId]?.socketId;
      if (receiverSocket) {
        io.to(receiverSocket).emit("typing", { chatId, userId });
      }
    });
  });

  // when user stops typing
  socket.on("stopTyping", ({ chatId }) => {
    const chatUsers = getChatUsers(chatId).filter(u => u.userId !== userId);
    chatUsers.forEach(u => {
      const receiverSocket = onlineUsers[u.userId]?.socketId;
      if (receiverSocket) {
        io.to(receiverSocket).emit("stopTyping", { chatId, userId });
      }
    });
  });


  });

  return { io, server };
};

// ✅ Proper getters
export const getIo = () => io;

export const getReceiverSocketId = (userId) =>
  onlineUsers[userId]?.socketId;
