import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDB } from "../config/db.js";

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
}

const SYSTEM_PROMPT = `You are Peyaraful's friendly cat adoption assistant. You help users with:
1. Cat care advice (feeding, health, grooming, behavior, litter training)
2. Finding available cats from the Peyaraful platform
3. Answering questions about the adoption process
4. General cat knowledge and fun facts

Guidelines:
- Be warm, friendly, and concise
- Use emoji sparingly (1-2 per message max)
- When users ask about available cats, refer to the CURRENT AVAILABLE CATS data provided below
- If you don't know something specific about a cat, direct them to the cats page
- Keep responses under 150 words unless detail is needed
- Always encourage adoption and responsible pet ownership`;

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "Messages array is required" });
    }

    const db = getDB();
    const availableCats = await db
      .collection("cats")
      .find({ status: "available" })
      .sort({ createdAt: -1 })
      .limit(20)
      .project({
        name: 1,
        breed: 1,
        age: 1,
        location: 1,
        gender: 1,
        temperament: 1,
        healthStatus: 1,
        description: 1,
      })
      .toArray();

    const catContext =
      availableCats.length > 0
        ? `\n\nCURRENT AVAILABLE CATS ON THE PLATFORM:\n${availableCats.map((c: any) => `- ${c.name} (${c.breed}, ${c.age} months, ${c.gender}, ${c.location})${c.temperament ? " — Temperament: " + c.temperament : ""}${c.healthStatus ? " — Health: " + c.healthStatus : ""}`).join("\n")}`
        : "\n\nNo cats are currently available for adoption.";

    const systemMessage = SYSTEM_PROMPT + catContext;

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: systemMessage,
    });

    const history = messages.slice(-20).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });

    const lastUserMessage = messages[messages.length - 1];
    const result = await chat.sendMessageStream(lastUserMessage.content);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Chat error:", error?.message || error);

    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to get AI response" });
    } else {
      res.write(
        `data: ${JSON.stringify({ content: "Sorry, I'm having trouble right now. Please try again later." })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
};
