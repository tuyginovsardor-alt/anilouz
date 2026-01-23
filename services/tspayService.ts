
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

/**
 * Supabase Edge Function-ni chaqiramiz.
 * Dashboardda funksiya nomi 'clever-api' bo'lgani uchun nomi shunday bo'lishi shart.
 */
export const createTsPayTransaction = async (amount: number, userId: string): Promise<TsPayResponse> => {
    try {
        const { data, error } = await supabase.functions.invoke('clever-api', {
            body: { action: 'create', amount, user_id: userId }
        });

        if (error) {
            console.error("Invoke error details:", error);
            throw new Error(error.message || "Edge Function xatosi yuz berdi.");
        }
        
        return data as TsPayResponse;
    } catch (err: any) {
        console.error("Invoke fail:", err);
        throw new Error(err.message || "To'lov tizimiga ulanib bo'lmadi.");
    }
};

export const checkTsPayStatus = async (chequeId: number): Promise<TsPayResponse> => {
    try {
        const { data, error } = await supabase.functions.invoke('clever-api', {
            body: { action: 'check', cheque_id: chequeId }
        });

        if (error) throw new Error(error.message);
        return data as TsPayResponse;
    } catch (err: any) {
        console.error("Status check fail:", err);
        throw new Error("To'lov holatini tekshirib bo'lmadi.");
    }
};
