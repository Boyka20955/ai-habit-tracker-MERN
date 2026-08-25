import express from "express";
import { login, register, me, updateProfile } from "../controllers/authcontroller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.put("/me", protect, updateProfile);
// Alias used by the frontend settings modal
router.put("/profile", protect, updateProfile);

export default router;