import express from "express";
import db2 from "./lib/db.js";//db connection
import cors from "cors";
import cookieParser from "cookie-parser";
// import cookieParser from "cookie-parser";

// routes
import authroutes from "./route/auth.route.js";


// models
import User from "./model/User.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: ["http://localhost:5173", "http://192.168.1.16:5173"],
    credentials: true,
}));

db2.authenticate()
  .then(() => console.log("✅ Sequelize Connected Successfully!"))
  .catch(err => console.error("❌ Sequelize connection failed:", err));

  app.use('/auth', authroutes);


app.get('/user', async (req, res) => {
    const users = await User.findAll();
    res.json(users);
});

   app.listen(3000,  () => console.log("🚀 Server is running on port 3000"));