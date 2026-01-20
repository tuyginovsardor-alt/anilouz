
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

/**
 * MUHIM: 405 (Method Not Allowed) xatosini oldini olish uchun 
 * endpoint oxiridagi '/' belgisi olib tashlandi. 
 * Ko'pgina API'lar POST so'rovini faqat aniq resurs manziliga qabul qiladi.
 */
const CREATE_ENDPOINT = `${TSPAY_BASE_URL}/transactions/create`; 

// 1. Tranzaksiya yaratish
export const createTsPayTransaction = async (amount: number, userId: string): Promise<TsPayCreateResponse> => {
    if (!TSPAY_MERCHANT_TOKEN) {
        throw new Error("Tizimda TsPay API kaliti sozlanmagan.");
    }

    try {
        console.log("--- TSPAY REQUEST START ---");
        console.log("Endpoint:", CREATE_ENDPOINT);

        const response = await fetch(CREATE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                access_token: TSPAY_MERCHANT_TOKEN,
                redirect_url: window.location.origin, 
                comment: `Anilo User ID: ${userId}`
            })
        });

        console.log("Server Status:", response.status);

        const responseText = await response.text();
        
        // Agar HTML qaytsa (redirect yoki xato sahifasi)
        if (responseText.includes("<!DOCTYPE html>")) {
            console.error("Server kutilmaganda HTML qaytardi (405 yoki 404 bo'lishi mumkin).");
            throw new Error(`Server JSON o'rniga HTML sahifa qaytardi (Status: ${response.status})`);
        }

        let data: any;
        try {
            data = JSON.parse(responseText.trim());
        } catch (e) {
            console.error("JSON Parse Error. Serverdan kelgan xom javob:", responseText);
            throw new Error("Server javobini o'qib bo'lmadi (JSON xatosi).");
        }

        if (!response.ok) {
            throw new Error(data.message || `To'lov tizimi xatosi: ${response.status}`);
        }
        
        if (data.status === 'error') {
            throw new Error(data.message || "TsPay xatolik qaytardi.");
        }

        if (!data.transaction || !data.transaction.url) {
            throw new Error("To'lov havolasi (URL) topilmadi.");
        }

        return data;
    } catch (error: any) {
        console.error("TsPay Catch Error:", error);
        throw new Error(error.message || "TsPay xizmatiga ulanishda xatolik.");
    }
};

// 2. Tranzaksiya holatini tekshirish
export const checkTsPayStatus = async (chequeId: number): Promise<TsPayCheckResponse> => {
    if (!TSPAY_MERCHANT_TOKEN) {
        throw new Error("Tizimda TsPay API kaliti sozlanmagan.");
    }

    try {
        // Holatni tekshirish uchun GET so'rovi oxirida slash bo'lishi yoki bo'lmasligi serverga bog'liq,
        // lekin odatda slashsiz ishlash xavfsizroq.
        const endpoint = `${TSPAY_BASE_URL}/transactions/${chequeId}?access_token=${TSPAY_MERCHANT_TOKEN}`;
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const responseText = await response.text();
        return JSON.parse(responseText.trim());
    } catch (error) {
        console.error("TsPay Check Status Error:", error);
        throw new Error("To'lov holatini tekshirib bo'lmadi.");
    }
};
