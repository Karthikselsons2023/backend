import express from "express";
import { openChat } from "../controllers/openChat.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /chat/:user_id → open chat with this user
// router.get("/:user_id", protectRoute, openChat);
router.get("/send", protectRoute, openChat);

export default router;
