import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import db2 from "./lib/db.js";
import { initSocket } from "./lib/socket.js";

// routes
import authroutes from "./route/auth.route.js";
import userroutes from "./route/user.route.js";
import chatRoutes from "./route/chat.route.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: ["http://localhost:5173", "http://192.168.1.16:5173"],
  credentials: true
}));

// routes
app.use("/auth", authroutes);
app.use("/", userroutes);
app.use("/chat", chatRoutes);
// DB connect
db2.authenticate()
  .then(() => console.log("✅ Sequelize Connected Successfully!"))
  .catch(err => console.error("❌ Sequelize connection failed:", err));

// socket init
const { server } = initSocket(app);

// start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on PORT: ${PORT}`);
});
