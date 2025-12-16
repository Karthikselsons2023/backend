import express from "express";
import { openChat,getMessages,createGroupChat,getGroupMessages,sendGroupMessage } from "../controllers/openChat.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /chat/:user_id → open chat with this user
// router.get("/:user_id", protectRoute, openChat);
router.post("/send", openChat);
router.get("/getMessages", protectRoute, getMessages);
router.post("/createGroup", protectRoute, createGroupChat);
router.get("/getGroupMessages", protectRoute, getGroupMessages);
router.post("/sendGroupMessage", protectRoute, sendGroupMessage);


export default router;
