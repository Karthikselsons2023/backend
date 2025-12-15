import express from "express";
import {users} from "../controllers/user.js";
import { protectRoute } from "../middleware/auth.middleware.js";


const router = express.Router();
router.get("/allusers",protectRoute, users);

export default router;