
import { supabase } from './supabaseClient';

export interface TsPayResponse {
    status: 'success' | 'error';
    transaction?: {
        id: number;
        url: string;
        status: string;
    };
    message?: string;
}

export const createTsPayTransaction = async (amount: number, userId: string): Promise<TsPayResponse> => {
    try {
        console.log("Invoking clever-api for user:", userId, "amount:", amount);
        
        // Supabase invoke ba'zan URL muammosi tufayli "Failed to fetch" beradi
        const { data, error } = await supabase.functions.invoke('clever-api', {
            body: { action: 'create', amount, user_id: userId }
        });

        if (error) {
            console.error("Invoke Error Object:", error);
            throw new Error(error.message || "Edge Function bilan ulanib bo'lmadi.");
        }
        
        return data as TsPayResponse;
    } catch (err: any) {
        console.error("Critical Connection Error:", err);
        return { 
            status: 'error', 
            message: "Server bilan bog'lanishda xatolik. Iltimos, internetingizni tekshiring yoki birozdan so'ng qayta urining." 
        };
    }
};
