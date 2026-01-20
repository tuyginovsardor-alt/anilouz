
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
 * MUHIM: Server redirect (301/302) muammosini oldini olish uchun 
 * endpoint oxiriga '/' belgisi qo'shildi.
 */
const CREATE_ENDPOINT = `${TSPAY_BASE_URL}/transactions/create/`; 

// 1. Tranzaksiya yaratish
export const createTsPayTransaction = async (amount: number, userId: string): Promise<TsPayCreateResponse> => {
    if (!TSPAY_MERCHANT_TOKEN) {
        throw new Error("Tizimda TsPay API kaliti sozlanmagan.");
    }

    try {
        console.log("--- TSPAY DEBUG START ---");
        console.log("URL:", CREATE_ENDPOINT);

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

        console.log("HTTP Status:", response.status);
        if (response.redirected) {
            console.log("Redirected to:", response.url);
        }

        const responseText = await response.text();
        
        // Agar HTML qaytsa (bu bizda catch-all rewrite sababli bo'ladi)
        if (responseText.includes("<!DOCTYPE html>")) {
            console.error("DEBUG: Server JSON o'rniga HTML qaytardi. Vercel rewrite qoidalarini tekshiring.");
            throw new Error(`Serverdan kutilmagan javob keldi (HTML). Status: ${response.status}`);
        }

        let data: any;
        try {
            data = JSON.parse(responseText.trim());
        } catch (e) {
            console.error("JSON Parse Error. Raw Response:", responseText);
            throw new Error("Server javobini o'qib bo'lmadi (JSON xatosi).");
        }

        if (!response.ok) {
            throw new Error(data.message || `To'lov tizimi xatosi: ${response.status}`);
        }
        
        if (data.status === 'error') {
            throw new Error(data.message || "TsPay xatolik qaytardi.");
        }

        if (!data.transaction || !data.transaction.url) {
            throw new Error("To'lov havolasi topilmadi.");
        }

        return data;
    } catch (error: any) {
        console.error("TsPay Create Catch:", error);
        throw new Error(error.message || "TsPay serveriga ulanishda xatolik.");
    }
};

// 2. Tranzaksiya holatini tekshirish
export const checkTsPayStatus = async (chequeId: number): Promise<TsPayCheckResponse> => {
    if (!TSPAY_MERCHANT_TOKEN) {
        throw new Error("Tizimda TsPay API kaliti sozlanmagan.");
    }

    try {
        const endpoint = `${TSPAY_BASE_URL}/transactions/${chequeId}/?access_token=${TSPAY_MERCHANT_TOKEN}`;
        
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
