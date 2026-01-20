
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
        // O'ZGARISH: Oxiridagi '/' belgisini olib tashladik.
        // /transactions/create/ -> /transactions/create
        const endpoint = `${TSPAY_BASE_URL}/transactions/create`; 

        console.log("To'lov yaratilmoqda...", { 
            url: endpoint, 
            amount, 
            userId 
        });

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount,
                access_token: TSPAY_MERCHANT_TOKEN,
                redirect_url: window.location.origin, // Hozirgi domen (anilo.uz)
                comment: `Anilo User: ${userId}`
            })
        });

        // Agar server xato kod qaytarsa (4xx, 5xx)
        if (!response.ok) {
            const errorText = await response.text();
            console.error("TsPay Server Error:", response.status, errorText);
            throw new Error(`To'lov tizimi xatosi: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Agar status error bo'lsa
        if (data.status === 'error') {
            console.error("TsPay API Error:", data);
            throw new Error(data.message || "To'lov yaratishda noma'lum xatolik.");
        }

        return data;
    } catch (error: any) {
        console.error("TsPay Create Catch:", error);
        // Foydalanuvchiga tushunarliroq xabar qaytarish
        const msg = error.message.includes('Failed to fetch') 
            ? "Server bilan aloqa yo'q (CORS yoki Internet muammosi)." 
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
        // GET so'rovda token parametr sifatida ketadi
        const response = await fetch(`${TSPAY_BASE_URL}/transactions/${chequeId}/?access_token=${TSPAY_MERCHANT_TOKEN}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

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
