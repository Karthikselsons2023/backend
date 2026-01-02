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
        "https://ripplecoin.in/"
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    
    //fetch userId from query params
    const { userId } = socket.handshake.query;
    console.log("new user connected:", socket.id , " user_id: ",userId);

    
    if (!userId)   { 
        socket.disconnect(); 
        return; 
      }

    //Mark User Online
    onlineUsers[userId] = { socketId: socket.id, };
    io.emit("getOnlineUsers", Object.keys(onlineUsers));

    //user disconnect event
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
  // when user stops typing
  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers[receiverId]?.socketId;
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId });
    }
  });

  // Join Group Chat 
  socket.on("joinGroup", ({ chat_id, user_id }) => {
  if (!chat_id || !user_id) return;

  const roomId = String(chat_id);
  socket.join(roomId);
  // socket.join(chat_id);

  console.log(`User ${user_id} joined group ${chat_id}`);

  // optional: notify group
  socket.to(chat_id).emit("groupUserJoined", {
    chat_id,
    user_id,
  });
});

//leave group chat
socket.on("leaveGroup", ({ chat_id, user_id }) => {
  socket.leave(chat_id);

  console.log(`User ${user_id} left group ${chat_id}`);

  socket.to(chat_id).emit("groupUserLeft", {
    chat_id,
    user_id,
  });
});



  });

  return { io, server };
};

// ✅ Proper getters
export const getIo = () => io;

export const getReceiverSocketId = (userId) =>
  onlineUsers[userId]?.socketId;
