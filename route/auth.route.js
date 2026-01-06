import express from "express";
import { login, logout, checkAuth,register } from "../controllers/auth.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", register);

router.get("/check", protectRoute, checkAuth);

export default router;
