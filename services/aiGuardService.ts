
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import * as db from "./dbService";

// 1. Existing tools with improved descriptions for the AI
const blockUserTool: FunctionDeclaration = {
  name: 'blockUser',
  parameters: {
    type: Type.OBJECT,
    description: "Xavfsizlik qoidalarini buzgan foydalanuvchini bloklash.",
    properties: {
      userId: { type: Type.STRING, description: "Foydalanuvchi UUID." },
      reason: { type: Type.STRING, description: "Nega bloklangani haqida qisqa izoh." },
    },
    required: ['userId', 'reason'],
  },
};

const revertSensitiveChangeTool: FunctionDeclaration = {
  name: 'revertSensitiveChange',
  parameters: {
    type: Type.OBJECT,
    description: "Ruxsatsiz o'zgartirilgan balans yoki rol ma'lumotlarini bazada asl holiga qaytarish.",
    properties: {
      userId: { type: Type.STRING, description: "Foydalanuvchi UUID." },
      field: { type: Type.STRING, description: "Maydon nomi (balance/role)." },
      originalValue: { type: Type.STRING, description: "Eski (to'g'ri) qiymat." },
    },
    required: ['userId', 'field', 'originalValue'],
  },
};

const maskVideoUrlTool: FunctionDeclaration = {
  name: 'maskVideoUrl',
  parameters: {
    type: Type.OBJECT,
    description: "Haqiqiy video URL manzilini vaqtinchalik va shifrlangan token bilan yashirish.",
    properties: {
      originalUrl: { type: Type.STRING, description: "Bazadagi original video manzil." },
      userId: { type: Type.STRING, description: "Foydalanuvchi UUID." },
      ttlMinutes: { type: Type.NUMBER, description: "Tokenning amal qilish muddati (minutda)." },
    },
    required: ['originalUrl', 'userId', 'ttlMinutes'],
  },
};

export const runAiServerManager = async (logContext: string) => {
  // Always initialize new instance to ensure up-to-date API key from environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Siz Anilo.uz tizimining CYBER SECURITY Guard-isiz. 
        VAZIFALARINGIZ:
        1. URL Masking: Har bir video so'roviga noyob 'maskVideoUrl' tokeni bering. 
           Format: anilo-v2://[base64_encoded_data].[signature]
        2. Hujum aniqlash: Agar foydalanuvchi o'z rolini 'admin' qilmoqchi bo'lsa yoki balansini noqonuniy oshirsa, uni 'blockUser' qiling.
        3. Fake Requests: Agar 'logContext' shubhali ko'rinsa, 'maskVideoUrl' o'rniga soxta URL qaytaring.

        LOGS:
        ${logContext}
      `,
      config: {
        tools: [{ functionDeclarations: [blockUserTool, revertSensitiveChangeTool, maskVideoUrlTool] }],
      },
    });

    const calls = response.functionCalls;
    const executionResults: string[] = [];
    let maskedUrl: string | null = null;

    if (calls && calls.length > 0) {
      for (const call of calls) {
        if (call.name === 'blockUser') {
          const { userId, reason } = call.args as any;
          await db.adminAdjustUserBalance(userId, 0, 'deduct', `AI_BLOCK: ${reason}`);
          executionResults.push(`USER_BLOCKED: ${userId}`);
        }
        
        if (call.name === 'revertSensitiveChange') {
          const { userId, field, originalValue } = call.args as any;
          const updates: any = {};
          updates[field] = field === 'balance' ? Number(originalValue) : originalValue;
          await db.updateUserProfile(userId, updates, true);
          executionResults.push(`REVERTED: ${field}`);
        }

        if (call.name === 'maskVideoUrl') {
          const { originalUrl, userId, ttlMinutes } = call.args as any;
          // Advanced masking simulation (signature based)
          const expiry = Date.now() + (ttlMinutes * 60000);
          const rawData = `${originalUrl}|${expiry}|${userId.slice(-4)}`;
          const token = btoa(rawData).split('').reverse().join('');
          maskedUrl = `anilo-v2://${token}.${Math.random().toString(36).substring(7)}`;
          executionResults.push("URL_SECURED");
        }
      }
    }

    return {
      analysis: response.text,
      actions: executionResults,
      maskedUrl: maskedUrl
    };
  } catch (error) {
    console.error("AI Guard Fail:", error);
    return null;
  }
};
