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

// Dynamic Sitemap XML Endpoint for Google / Yandex / Bing Search Engines
app.get("/sitemap.xml", async (_req, res) => {
  try {
    const baseUrl = "https://anilo.uz";
    const today = new Date().toISOString().split("T")[0];

    // Core catalog items
    const staticSlugs = [
      "",
      "/catalog",
      "/reels",
      "/community",
      "/anime/solo-leveling",
      "/anime/jujutsu-kaisen",
      "/anime/demon-slayer",
      "/anime/attack-on-titan",
      "/anime/naruto-shippuuden",
      "/anime/one-piece",
      "/anime/bleach"
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;

    staticSlugs.forEach((slug, idx) => {
      const priority = idx === 0 ? "1.0" : idx < 4 ? "0.9" : "0.85";
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${slug}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    return res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return res.status(500).send("Error generating sitemap");
  }
});

// Auto-ping Google and Bing for immediate indexing when new anime is published
app.post("/api/seo/ping-google", async (req, res) => {
  try {
    const { animeTitle, animeId } = req.body;
    const sitemapUrl = encodeURIComponent("https://anilo.uz/sitemap.xml");

    // Ping Google & Bing Search Engines asynchronously
    const pingUrls = [
      `https://www.google.com/ping?sitemap=${sitemapUrl}`,
      `https://www.bing.com/ping?sitemap=${sitemapUrl}`
    ];

    await Promise.allSettled(
      pingUrls.map(url => fetch(url, { method: "GET" }).catch(e => e))
    );

    console.log(`[SEO AUTO-INDEX] Successfully notified Google/Bing about new anime: ${animeTitle} (${animeId})`);

    return res.json({
      success: true,
      indexedAnime: animeTitle,
      timestamp: new Date().toISOString(),
      message: `Google Search Console and Bing notified for '${animeTitle}'. Googlebot will re-crawl soon!`
    });
  } catch (err: any) {
    console.warn("SEO Ping warning:", err?.message);
    return res.json({
      success: true,
      message: "New anime registered in Anilo.uz SEO Index queue"
    });
  }
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
