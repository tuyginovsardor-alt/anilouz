
import { supabase } from './supabaseClient';

export interface TsPayResponse {
    status: 'success' | 'error';
    transaction?: {
        id: number | string;
        url: string;
    };
    message?: string;
}

export const createTsPayTransaction = async (amount: number, userId: string): Promise<TsPayResponse> => {
    try {
        // Supabase Edge Function'ni bevosita chaqiramiz
        const { data, error } = await supabase.functions.invoke('clever-api', {
            body: { 
                action: 'create', 
                amount: amount, 
                user_id: userId 
            }
        });

        // Agar Supabase darajasida xato bo'lsa (masalan, funksiya topilmadi)
        if (error) {
            console.error("Supabase Invoke Error:", error);
            return { 
                status: 'error', 
                message: "Server funksiyasini ishga tushirib bo'lmadi." 
            };
        }
        
        // Funksiyadan qaytgan natijani beramiz
        return data as TsPayResponse;
    } catch (err: any) {
        console.error("Internal Service Error:", err);
        return { 
            status: 'error', 
            message: "Kutilmagan ichki xatolik yuz berdi." 
        };
    }
};
