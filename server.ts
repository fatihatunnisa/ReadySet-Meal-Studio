import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "ReadySet. Meal Studio" });
  });

  // AI Pantry Scan - Analyzes image of pantry
  app.post("/api/pantry/scan", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "No image data provided" });
      }

      const response = await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: image, mimeType: mimeType || "image/jpeg" } },
            { text: "List every food item, ingredient, or product visible in this pantry/refrigerator image. Return only a simple JSON array of strings containing the item names." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const items = JSON.parse(response.text || "[]");
      res.json({ items });
    } catch (error) {
      console.error("Scan Error:", error);
      res.status(500).json({ error: "Failed to scan pantry" });
    }
  });

  // AI Recipe Suggestions based on pantry
  app.post("/api/recipes/suggest", async (req, res) => {
    try {
      const { pantryItems } = req.body;
      
      const response = await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Given these pantry items: ${pantryItems.join(", ")}, suggest 5 creative and healthy recipes I can cook. Return as JSON array of objects with 'name', 'emoji', 'time', 'ingredients' (array of strings), and 'tags' (array of strings starting with #).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                emoji: { type: Type.STRING },
                time: { type: Type.STRING },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "emoji", "time", "ingredients", "tags"]
            }
          }
        }
      });

      const suggestions = JSON.parse(response.text || "[]");
      res.json({ suggestions });
    } catch (error) {
      console.error("Suggestion Error:", error);
      res.status(500).json({ error: "Failed to suggest recipes" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ReadySet. Meal Studio running on http://localhost:${PORT}`);
  });
}

startServer();
