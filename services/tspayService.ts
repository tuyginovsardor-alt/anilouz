
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
 * MUHIM: '/api-tspay' proksi orqali so'rov yuboramiz.
 * Vite configda bu 'https://tspay.uz/api/v1' ga almashtiriladi.
 */
const CREATE_ENDPOINT = `${TSPAY_BASE_URL}/transactions/create`; 

// 1. Tranzaksiya yaratish
export const createTsPayTransaction = async (amount: number, userId: string): Promise<TsPayCreateResponse> => {
    if (!TSPAY_MERCHANT_TOKEN) {
        console.warn("TsPay API kaliti topilmadi.");
    }

    try {
        console.log(`[TsPay] So'rov: ${CREATE_ENDPOINT}`);
        
        const payload = {
            amount: amount,
            access_token: TSPAY_MERCHANT_TOKEN,
            redirect_url: window.location.origin,
            comment: `Anilo ID: ${userId}`
        };

        // Ba'zi serverlar 'X-Requested-With' headerini yoqtirmaydi, shuning uchun olib tashladik
        // Faqat eng zarur headerlar qoldi
        const response = await fetch(CREATE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        
        // HTML qaytishini tekshirish (Proxy muammosi)
        // Agar javob "<" bilan boshlansa, demak bu aniq HTML (saytning o'zi)
        if (responseText.trim().startsWith("<")) {
            console.error("[TsPay] Proxy Xatosi: HTML qaytdi.", responseText.substring(0, 100));
            throw new Error("PROXY_ERROR"); // Maxsus kod
        }

        let data: any;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("[TsPay] JSON Parse Error:", responseText);
            throw new Error("To'lov tizimidan noto'g'ri javob keldi.");
        }

        if (data.status === 'error') {
            throw new Error(data.message || "TsPay to'lovni rad etdi.");
        }

        if (!data.transaction || !data.transaction.url) {
            throw new Error("To'lov havolasi topilmadi.");
        }

        return data;
    } catch (error: any) {
        console.error("[TsPay] Catch Error:", error);
        throw error; // Xatoni o'zgartirmasdan uzatamiz
    }
};

// 2. Tranzaksiya holatini tekshirish
export const checkTsPayStatus = async (chequeId: number): Promise<TsPayCheckResponse> => {
    try {
        const endpoint = `${TSPAY_BASE_URL}/transactions/${chequeId}?access_token=${TSPAY_MERCHANT_TOKEN}`;
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        const responseText = await response.text();
        if (responseText.trim().startsWith("<")) throw new Error("PROXY_ERROR");

        return JSON.parse(responseText);
    } catch (error) {
        console.error("[TsPay] Check Status Error:", error);
        throw new Error("To'lov holatini tekshirib bo'lmadi.");
    }
};
