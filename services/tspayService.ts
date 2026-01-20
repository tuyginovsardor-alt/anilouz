
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
        throw new Error("Tizimda TsPay API kaliti sozlanmagan.");
    }

    try {
        // Status 200 kelgan bo'lsa, demak bu endpoint to'g'ri.
        const endpoint = `${TSPAY_BASE_URL}/transactions/create`; 

        console.log(`So'rov yuborilmoqda: ${endpoint}, Summa: ${amount}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                access_token: TSPAY_MERCHANT_TOKEN,
                redirect_url: window.location.origin, 
                comment: `Anilo User: ${userId}`
            })
        });

        // Raw textni olamiz, chunki server sarlavhani noto'g'ri yuborishi mumkin
        const responseText = await response.text();
        console.log("Serverdan kelgan javob (raw):", responseText);

        let data: any;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            // Agar JSON emas HTML qaytsa
            if (responseText.includes("<!DOCTYPE html>")) {
                throw new Error(`Server tizim sahifasini qaytardi (HTML). Status: ${response.status}`);
            }
            throw new Error(`Server javobini o'qib bo'lmadi (JSON xatosi). Status: ${response.status}`);
        }

        if (!response.ok) {
            console.error("TsPay Server Error Data:", data);
            throw new Error(data.message || `To'lov tizimi xatosi: ${response.status}`);
        }
        
        if (data.status === 'error') {
            console.error("TsPay API Logic Error:", data);
            throw new Error(data.message || "To'lov yaratishda xatolik.");
        }

        return data;
    } catch (error: any) {
        console.error("TsPay Create Catch:", error);
        throw new Error(error.message || "Ulanishda xatolik yuz berdi.");
    }
};

// 2. Tranzaksiya holatini tekshirish
export const checkTsPayStatus = async (chequeId: number): Promise<TsPayCheckResponse> => {
    if (!TSPAY_MERCHANT_TOKEN) {
        throw new Error("Tizimda TsPay API kaliti sozlanmagan.");
    }

    try {
        const response = await fetch(`${TSPAY_BASE_URL}/transactions/${chequeId}/?access_token=${TSPAY_MERCHANT_TOKEN}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const responseText = await response.text();
        const data = JSON.parse(responseText);
        return data;
    } catch (error) {
        console.error("TsPay Check Error:", error);
        throw new Error("To'lov holatini tekshirib bo'lmadi.");
    }
};
