
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
        const { data, error } = await supabase.functions.invoke('clever-api', {
            body: { action: 'create', amount, user_id: userId }
        });

        if (error) {
            return { 
                status: 'error', 
                message: "Server bilan bog'lanishda xatolik yuz berdi." 
            };
        }
        
        return data as TsPayResponse;
    } catch (err: any) {
        return { status: 'error', message: "Kutilmagan xatolik yuz berdi." };
    }
};
