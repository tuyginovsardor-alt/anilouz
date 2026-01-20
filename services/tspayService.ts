
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
    // API kalit borligini tekshirish
    if (!TSPAY_MERCHANT_TOKEN) {
        console.error("VITE_TSPAY_API topilmadi. Config:", TSPAY_MERCHANT_TOKEN);
        throw new Error("Tizimda TsPay API kaliti sozlanmagan. Admin bilan bog'laning.");
    }

    try {
        // TAHMIN: 405 xatosi Redirect tufayli bo'lishi mumkin. 
        // Shuning uchun slashsiz 'transaction/create' ishlatamiz.
        // Agar bu ham ishlamasa, 'transactions/create' (ko'plik) bo'lishi mumkin.
        const endpoint = `${TSPAY_BASE_URL}/transaction/create`; 

        console.log(`POST so'rov yuborilmoqda: ${endpoint}`);

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

        // Redirect bo'lganini tekshirish (URL o'zgargan bo'lsa)
        if (response.redirected) {
            console.warn("Server redirect qildi:", response.url);
        }

        // Javob turi JSON ekanligini tekshirish
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") === -1) {
            const text = await response.text();
            console.error(`Non-JSON response (${response.status}):`, text.substring(0, 500));
            
            if (response.status === 404) {
                 throw new Error("Tizim Xatosi: To'lov manzili topilmadi (404).");
            }
            if (response.status === 405) {
                 throw new Error("Tizim Xatosi: 405 (Method Not Allowed). Server POST so'rovni qabul qilmadi. Ehtimol manzil noto'g'ri.");
            }
            throw new Error(`Serverdan kutilmagan javob keldi: ${response.status}`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("TsPay Server Error:", response.status, errorText);
            throw new Error(`To'lov tizimi xatosi: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status === 'error') {
            console.error("TsPay API Error:", data);
            throw new Error(data.message || "To'lov yaratishda noma'lum xatolik.");
        }

        return data;
    } catch (error: any) {
        console.error("TsPay Create Catch:", error);
        const msg = error.message.includes('Failed to fetch') 
            ? "Server bilan aloqa yo'q (Internet yoki CORS muammosi)." 
            : error.message;
        throw new Error(msg);
    }
};

// 2. Tranzaksiya holatini tekshirish
export const checkTsPayStatus = async (chequeId: number): Promise<TsPayCheckResponse> => {
    if (!TSPAY_MERCHANT_TOKEN) {
        throw new Error("Tizimda TsPay API kaliti sozlanmagan.");
    }

    try {
        const response = await fetch(`${TSPAY_BASE_URL}/transaction/${chequeId}/?access_token=${TSPAY_MERCHANT_TOKEN}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") === -1) {
             throw new Error("API Proksi xatosi (HTML response).");
        }

        if (!response.ok) {
             throw new Error(`Server xatosi: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("TsPay Check Error:", error);
        throw new Error("To'lov holatini tekshirib bo'lmadi.");
    }
};
