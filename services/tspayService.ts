
// TsPay API Service
// Hujjat: https://tspay.uz/docs
import { TSPAY_BASE_URL, TSPAY_MERCHANT_TOKEN } from '../config';

export interface TsPayCreateResponse {
    status: 'success' | 'error';
    transaction: {
        id: number;
        url: string;
        status: string;
    };
    message?: string;
}

export interface TsPayCheckResponse {
    status: 'success' | 'error';
    data: {
        id: number;
        amount: number;
        pay_status: 'paid' | 'pending' | 'canceled';
    };
    message?: string;
}

// 1. Tranzaksiya yaratish
export const createTsPayTransaction = async (amount: number, userId: string): Promise<TsPayCreateResponse> => {
    if (!TSPAY_MERCHANT_TOKEN) {
        throw new Error("Tizimda TsPay API kaliti sozlanmagan. Admin bilan bog'laning.");
    }

    try {
        const response = await fetch(`${TSPAY_BASE_URL}/transactions/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Ba'zi APIlar CORS uchun maxsus header talab qilishi mumkin, lekin odatda public APIlar ochiq bo'ladi
            },
            body: JSON.stringify({
                amount: amount,
                access_token: TSPAY_MERCHANT_TOKEN,
                redirect_url: window.location.origin, // https://anilo.uz ga qaytaradi
                comment: `Anilo User: ${userId}`
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("TsPay Create Error:", error);
        throw new Error("To'lov yaratishda xatolik yuz berdi. Internetni tekshiring.");
    }
};

// 2. Tranzaksiya holatini tekshirish
export const checkTsPayStatus = async (chequeId: number): Promise<TsPayCheckResponse> => {
    if (!TSPAY_MERCHANT_TOKEN) {
        throw new Error("Tizimda TsPay API kaliti sozlanmagan.");
    }

    try {
        // GET so'rovda token parametr sifatida ketadi
        const response = await fetch(`${TSPAY_BASE_URL}/transactions/${chequeId}/?access_token=${TSPAY_MERCHANT_TOKEN}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("TsPay Check Error:", error);
        throw new Error("To'lov holatini tekshirib bo'lmadi.");
    }
};
