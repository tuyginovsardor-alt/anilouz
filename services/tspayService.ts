
import { supabase } from './supabaseClient';

export interface TsPayResponse {
    status: 'success' | 'error';
    transaction?: {
        id: number;
        url: string;
        status: string;
    };
    data?: {
        id: number;
        amount: number;
        pay_status: 'paid' | 'pending' | 'canceled';
    };
    message?: string;
}

export const createTsPayTransaction = async (amount: number, userId: string): Promise<TsPayResponse> => {
    try {
        const { data, error } = await supabase.functions.invoke('clever-api', {
            body: { action: 'create', amount, user_id: userId }
        });

        if (error) {
            console.error("Invoke error:", error);
            throw new Error(error.message || "Ulanishda xatolik.");
        }
        
        return data as TsPayResponse;
    } catch (err: any) {
        console.error("Invoke fail:", err);
        return { status: 'error', message: err.message || "Tizimga ulanib bo'lmadi." };
    }
};

export const checkTsPayStatus = async (chequeId: number): Promise<TsPayResponse> => {
    try {
        const { data, error } = await supabase.functions.invoke('clever-api', {
            body: { action: 'check', cheque_id: chequeId }
        });
        if (error) throw error;
        return data as TsPayResponse;
    } catch (err: any) {
        return { status: 'error', message: "Holatni tekshirib bo'lmadi." };
    }
};
