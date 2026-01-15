
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Movie } from '../types';

const apiKey = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey });

const API_TIMEOUT = 20000; // 20 soniya

// We keep the schema variable name 'movieSchema' to avoid refactoring everything, 
// but logically it now represents Anime data.
const movieSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The full title of the anime." },
        year: { type: Type.INTEGER, description: "The year the anime was released." },
        plot: { type: Type.STRING, description: "A brief summary of the anime's plot." },
        posterUrl: { type: Type.STRING, description: "A direct URL to a high-quality poster image for the anime. Should start with https://." },
        genre: { type: Type.STRING, description: "The primary genre of the anime (e.g., Shonen, Isekai, Action)." },
        language: { type: Type.STRING, description: "The original language (usually Japanese)." },
        quality: { type: Type.STRING, description: "The available viewing quality, e.g., HD, 4K, SD." },
        rating: { type: Type.NUMBER, description: "A numerical rating for the anime, from 0 to 5." }
    },
    required: ["title", "year", "plot", "posterUrl", "genre", "language", "quality", "rating"]
};

const commonConfig = {
    responseMimeType: "application/json",
    responseSchema: {
        type: Type.ARRAY,
        items: movieSchema,
    },
};

const parseGeminiResponse = (text: string): any => {
    const cleanedText = text.trim();

    try {
        return JSON.parse(cleanedText);
    } catch (e) {
        // Fails, try to extract from markdown
    }

    const markdownMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        try {
            return JSON.parse(markdownMatch[1]);
        } catch (e) {
            // Fails
        }
    }
    
    const firstBracket = cleanedText.startsWith('[') ? '[' : '{';
    const lastBracket = cleanedText.startsWith('[') ? ']' : '}';
    const startIndex = cleanedText.indexOf(firstBracket);
    const endIndex = cleanedText.lastIndexOf(lastBracket);

    if (startIndex !== -1 && endIndex > startIndex) {
        try {
            const potentialJson = cleanedText.substring(startIndex, endIndex + 1);
            return JSON.parse(potentialJson);
        } catch(e) {
            // Fails
        }
    }

    console.error("Failed to parse JSON from Gemini response. Raw text:", cleanedText);
    throw new Error("API javobini tahlil qilib bo'lmadi.");
}


const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("API so'rovi belgilangan vaqtdan oshib ketdi."));
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
};


export const getPopularMovies = async (): Promise<Movie[]> => {
    try {
        const apiCall = ai.models.generateContent({
            model: "gemini-2.5-flash",
            // Updated prompt for Anime
            contents: `Provide a list of 12 highly-rated and popular anime series or movies suitable for a general audience. For each anime, provide its title, release year, a brief plot summary, a valid poster URL, its genre (e.g., Shonen, Seinen, Isekai), original language (Japanese), available quality (like HD or 4K), and a rating out of 5.`,
            config: commonConfig,
        });

        const response = await withTimeout<GenerateContentResponse>(apiCall, API_TIMEOUT);

        return parseGeminiResponse(response.text || '');
    } catch (error) {
        console.error("Error calling Gemini API for popular anime:", error);
        if (error instanceof Error && error.message.includes("tahlil qilib bo'lmadi")) {
            throw error;
        }
        if (error instanceof Error && error.message.includes("oshib ketdi")) {
            throw new Error("Serverdan javob olish uzoq vaqt talab qildi. Iltimos, qayta urinib ko'ring.");
        }
        throw new Error("Ommabop animelar ma'lumotini olib bo'lmadi.");
    }
};


export const searchMovies = async (query: string): Promise<Movie[]> => {
    try {
        const apiCall = ai.models.generateContent({
            model: "gemini-2.5-flash",
            // Updated prompt for Anime search
            contents: `Find detailed information for anime (series or movies) matching the query: "${query}". For each anime, provide its title, release year, plot summary, a poster URL, genre, language, quality, and a rating out of 5. Return at least 5 results if available.`,
            config: commonConfig,
        });
        
        const response = await withTimeout<GenerateContentResponse>(apiCall, API_TIMEOUT);

        return parseGeminiResponse(response.text || '');

    } catch (error) {
        console.error("Error calling Gemini API for anime search:", error);
        if (error instanceof Error && error.message.includes("tahlil qilib bo'lmadi")) {
            throw error;
        }
        if (error instanceof Error && error.message.includes("oshib ketdi")) {
            throw new Error("Serverdan javob olish uzoq vaqt talab qildi. Iltimos, qayta urinib ko'ring.");
        }
        throw new Error("Anime ma'lumotlarini qidirishda xatolik yuz berdi.");
    }
};
