import { Router } from "express";
import { chatWithAI } from "../controllers/chatController.js";

const router = Router();

router.post("/", chatWithAI);

export default router;
