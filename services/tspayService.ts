
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
 * Yangi yaratilgan Supabase Edge Function-ni chaqiramiz.
 * Bu fronteddan to'g'ridan-to'g'ri API kalitini ishlatishdan ancha xavfsiz.
 */
export const createTsPayTransaction = async (amount: number, userId: string): Promise<TsPayResponse> => {
    const { data, error } = await supabase.functions.invoke('tspay-handler', {
        body: { action: 'create', amount, user_id: userId }
    });

    if (error) throw new Error(error.message || "Edge Function bilan bog'lanib bo'lmadi");
    return data as TsPayResponse;
};

export const checkTsPayStatus = async (chequeId: number): Promise<TsPayResponse> => {
    const { data, error } = await supabase.functions.invoke('tspay-handler', {
        body: { action: 'check', cheque_id: chequeId }
    });

    if (error) throw new Error(error.message || "Holatni tekshirishda xatolik");
    return data as TsPayResponse;
};
