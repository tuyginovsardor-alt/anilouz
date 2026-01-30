
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
        console.log("To'lov so'rovi yuborilmoqda...");
        
        // Supabase Edge Function so'rovi
        const { data, error } = await supabase.functions.invoke('clever-api', {
            body: { action: 'create', amount, user_id: userId }
        });

        if (error) {
            console.error("Supabase funksiya xatosi:", error);
            // Agar CORS yoki Network xatosi bo'lsa, bu yerga tushadi
            return { 
                status: 'error', 
                message: "Ulanishda xatolik. Iltimos, VPN o'chiqligini tekshiring yoki sahifani yangilang." 
            };
        }
        
        return data as TsPayResponse;
    } catch (err: any) {
        console.error("Kritik xatolik:", err);
        return { status: 'error', message: "Kutilmagan xatolik yuz berdi." };
    }
};
