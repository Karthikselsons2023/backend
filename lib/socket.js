import { Server } from "socket.io";
import http from "http";

export const initSocket = (app) => {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://192.168.1.16:5173",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // userId -> { socketId, userId, name, profile }
  const onlineUsers = {};

  io.on("connection", (socket) => {
    console.log("new user connected: ",socket.id)
    const { userId } = socket.handshake.query;

    if (!userId) {
      socket.disconnect();
      return;
    }

    onlineUsers[userId] = {
      socketId: socket.id,
    };

    

    io.emit("getOnlineUsers", Object.keys(onlineUsers));

    socket.on("disconnect", () => {
      delete onlineUsers[userId];
      io.emit("getOnlineUsers", Object.keys(onlineUsers));
    });
  });

  return { io, server };
};
export function getReceiverSocketId(userId){
    return userSocketMap[userId];
}
