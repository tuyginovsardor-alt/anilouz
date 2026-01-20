
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
        // MUHIM: Ba'zi versiyalarda 'transaction' (birlik), ba'zilarida 'transactions' (ko'plik).
        // Shuningdek, oxirida '/' belgisi bo'lishi kerak.
        const endpoint = `${TSPAY_BASE_URL}/transaction/create/`; 

        console.log("To'lov yaratilmoqda...", { 
            url: endpoint, 
            amount, 
            userId 
        });

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

        // Javob turi JSON ekanligini tekshirish
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") === -1) {
            const text = await response.text();
            console.error("Non-JSON response from TsPay Proxy:", text.substring(0, 500));
            
            if (text.includes("<!DOCTYPE html>")) {
                 throw new Error("Tizim Xatosi: API Proksi manzilni topolmadi (404). URL noto'g'ri bo'lishi mumkin.");
            }
            throw new Error(`Serverdan kutilmagan javob keldi: ${response.status}`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("TsPay Server Error:", response.status, errorText);
            
            if (response.status === 405) {
                throw new Error("Xatolik 405: To'lov tizimi metodga ruxsat bermadi. Iltimos admin bilan bog'laning.");
            }
            if (response.status === 404) {
                throw new Error("Xatolik 404: To'lov manzili topilmadi. Tizim sozlamalarini tekshiring.");
            }
            
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
