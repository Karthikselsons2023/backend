import express from "express";
import { openChat,getMessages } from "../controllers/openChat.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /chat/:user_id → open chat with this user
// router.get("/:user_id", protectRoute, openChat);
router.post("/send", protectRoute, openChat);
router.get("/getMessages", protectRoute, getMessages);

export default router;
