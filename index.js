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


dotenv.config({ debug: false});

const app = express();
const PORT = process.env.PORT || 5000;
  
// middleware
app.use(express.json());
 
// / ✅ parse urlencoded bodies (optional)
app.use(express.urlencoded({ extended: true }));

 
app.use(express.urlencoded({ extended: true }));
 
app.use(cookieParser());

// app.use(cors({
//   origin: ["http://localhost:5173", "http://192.168.1.18:5173","https://ripplecoin.in"],
//   credentials: true
// }));
app.use(cors({
  origin: ["http://localhost:5173", "http://192.168.1.18:5173","https://frontend.ripplecoin.in"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

// Handle preflight requests for all routes
app.options('*', cors({
  origin: ["http://localhost:5173", "http://192.168.1.18:5173","https://frontend.ripplecoin.in"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

// routes
app.get('/test', (req, res) => {
  res.send('Server is running');
});
app.use("/auth", authroutes);
app.use("/", userroutes);
app.use("/chat", chatRoutes);
// DB connect
db2.authenticate()
  .then(() => console.log("✅ Sequelize Connected Successfully!"))
  .catch(err => console.error("❌ Sequelize connection failed:", err));
 
// socket init
const { server } = initSocket(app);

 
 // start server (ONLY THIS)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on PORT: ${PORT}`);
});