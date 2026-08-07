import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API lazily or when requested
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Anilo Anime Platform" });
});

// Gemini AI Anime Assistant endpoint
app.post("/api/ai-recommend", async (req, res) => {
  try {
    const { prompt, genre, userPreference } = req.body;
    const ai = getAiClient();

    if (!ai) {
      // Fallback recommendation if no API key set
      return res.json({
        recommendations: [
          {
            title: "Naruto: Shippuuden",
            reason: "Chiroyli janglar va kuchli syujet. Anime ixlosmandlari uchun klassika.",
            matchRate: 98
          },
          {
            title: "Jujutsu Kaisen",
            reason: "Zamonaviy fantastik jang va super vizual effektlar.",
            matchRate: 95
          },
          {
            title: "Solo Leveling",
            reason: "Manhwa asosidagi eng mashhur aksiyaga boy yangi anime.",
            matchRate: 94
          }
        ],
        aiMessage: "Mana sizning so'rovingiz bo'yicha eng mos keladigan animelar to'plami!"
      });
    }

    const systemInstruction = `Siz ANILO.UZ platformasining rasmiy sun'iy intellect maslahatchisisiz. Uzbek tilida muloyim, qiziqarli va professional javob berasiz. Foydalanuvchining ta'bi va janr xohishiga qarab 3 ta anime tavsiya qiling.
Javobingizni JSON formatida qaytaring:
{
  "aiMessage": "Foydalanuvchiga Uzbek tilida qisqa samimiy xabar",
  "recommendations": [
    { "title": "Anime nomi", "reason": "Nega tavsiya etilganligi (Uzbek tilida)", "matchRate": 95 }
  ]
}`;

    const userQuery = `Foydalanuvchi so'rovi: "${prompt || 'Jangovar va qiziqarli anime tavsiya et'}" ${genre ? `Janr: ${genre}` : ''} ${userPreference ? `Afzallik: ${userPreference}` : ''}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userQuery,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return res.json(data);
  } catch (err: any) {
    console.error("AI recommendation error:", err);
    return res.status(500).json({
      error: "AI tavsiya xizmatida xatolik ro'y berdi",
      details: err?.message
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ANILO.UZ] Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
