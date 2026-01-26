
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import * as db from "./dbService";

// 1. Existing tools
const blockUserTool: FunctionDeclaration = {
  name: 'blockUser',
  parameters: {
    type: Type.OBJECT,
    description: "Foydalanuvchini tizimdan butunlay bloklash (xavfsizlik buzilganda).",
    properties: {
      userId: { type: Type.STRING, description: "Foydalanuvchining UUID kodi." },
      reason: { type: Type.STRING, description: "Bloklash sababi." },
    },
    required: ['userId', 'reason'],
  },
};

// 2. NEW TOOL: Revert Sensitive Data
// Fix: Using double quotes for strings containing apostrophes to prevent syntax errors that break block-scoping
const revertSensitiveChangeTool: FunctionDeclaration = {
  name: 'revertSensitiveChange',
  parameters: {
    type: Type.OBJECT,
    description: "Ruxsatsiz o'zgartirilgan maydonni (balance yoki role) asl holiga qaytarish.",
    properties: {
      userId: { type: Type.STRING, description: "Foydalanuvchi UUID." },
      field: { type: Type.STRING, description: "O'zgartirilgan maydon nomi (balance yoki role)." },
      originalValue: { type: Type.STRING, description: "Bazada bo'lishi kerak bo'lgan asl qiymat." },
    },
    required: ['userId', 'field', 'originalValue'],
  },
};

const moderateFandubTool: FunctionDeclaration = {
  name: 'moderateFandub',
  parameters: {
    type: Type.OBJECT,
    description: "Fandub yuklamalarini avtomatik moderatsiya qilish.",
    properties: {
      uploadId: { type: Type.NUMBER, description: "Yuklama ID raqami." },
      action: { type: Type.STRING, description: 'Amal: "approve" (tasdiqlash) yoki "reject" (rad etish).' },
      comment: { type: Type.STRING, description: "Admin/AI izohi." },
    },
    required: ['uploadId', 'action', 'comment'],
  },
};

export const runAiServerManager = async (logContext: string) => {
  // Fix: Move GoogleGenAI initialization inside the function to ensure it uses the latest API key as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Siz Anilo.uz serverining CYBER SECURITY va nazorat menejerisiz. 
        Sizning asosiy vazifangiz IDOR va Privilege Escalation (huquqni oshirish) hujumlarining oldini olish.
        
        QOIDALAR:
        1. Faqat 'admin', 'owner' va 'system_tspay' (tulov tizimi) 'balance' va 'role'ni o'zgartirishi mumkin.
        2. Agar 'user' roli o'zining yoki boshqaning balansini yoki rolini o'zgartirayotgan bo'lsa, bu BUZGINCHILIK.
        3. Bunday holatda:
           - Foydalanuvchini 'blockUser' orqali bloklang.
           - O'zgarishni 'revertSensitiveChange' orqali darhol bekor qiling.
        
        LOGLAR VA KONTEKST:
        ---
        ${logContext}
        ---
        Vaziyatni tahlil qiling va qat'iy choralar ko'ring.
      `,
      config: {
        tools: [{ functionDeclarations: [blockUserTool, moderateFandubTool, revertSensitiveChangeTool] }],
      },
    });

    const calls = response.functionCalls;
    const executionResults = [];

    if (calls && calls.length > 0) {
      for (const call of calls) {
        if (call.name === 'blockUser') {
          const { userId, reason } = call.args as any;
          console.error(`SECURITY ALERT: Blocking user ${userId}. Reason: ${reason}`);
          await db.adminAdjustUserBalance(userId, 0, 'deduct', `AI Security Block: ${reason}`); 
          executionResults.push(`BLOCK: Foydalanuvchi ${userId} bloklandi (${reason})`);
        }
        
        if (call.name === 'revertSensitiveChange') {
          const { userId, field, originalValue } = call.args as any;
          // Reverting the malicious change
          const updates: any = {};
          updates[field] = field === 'balance' ? Number(originalValue) : originalValue;
          await db.updateUserProfile(userId, updates, true); // true = bypass security check for system revert
          executionResults.push(`REVERT: ${field} maydoni ${originalValue} holatiga qaytarildi.`);
        }

        if (call.name === 'moderateFandub') {
          const { uploadId, action, comment } = call.args as any;
          if (action === 'approve') await db.approveFandubUpload(uploadId);
          else await db.rejectFandubUpload(uploadId, comment);
          executionResults.push(`MODERATION: Fandub #${uploadId} -> ${action}`);
        }
      }
    }

    return {
      analysis: response.text,
      actions: executionResults
    };
  } catch (error) {
    console.error("AI Guard Security Error:", error);
    return null;
  }
};
