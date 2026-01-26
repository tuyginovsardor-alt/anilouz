
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import * as db from "./dbService";

// 1. Core security tools
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

export const runAiServerManager = async (logContext: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Siz Anilo.uz tizimining CYBER SECURITY Guard-isiz. 
        VAZIFALARINGIZ:
        1. Hujum aniqlash: Agar foydalanuvchi o'z rolini 'admin' qilmoqchi bo'lsa yoki balansini noqonuniy oshirsa, uni 'blockUser' qiling.
        2. Qaytarish (Revert): Ruxsatsiz o'zgartirilgan maydonlarni 'revertSensitiveChange' orqali asl holiga keltiring.
        3. Monitoring: Tizimdagi barcha shubhali harakatlarni tahlil qiling.

        LOGS:
        ${logContext}
      `,
      config: {
        tools: [{ functionDeclarations: [blockUserTool, revertSensitiveChangeTool] }],
      },
    });

    const calls = response.functionCalls;
    const executionResults: string[] = [];

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
      }
    }

    return {
      analysis: response.text,
      actions: executionResults
    };
  } catch (error) {
    console.error("AI Guard Fail:", error);
    return null;
  }
};
