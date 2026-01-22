
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
    // Token tekshiruvi
    if (!TSPAY_MERCHANT_TOKEN) {
        console.warn("TsPay API kaliti topilmadi. So'rov baribir yuborilmoqda...");
    }

    try {
        console.log(`[TsPay] So'rov yuborilmoqda: ${CREATE_ENDPOINT}`);
        
        // TsPay ma'lumotlarni POST body ichida qabul qiladi
        const payload = {
            amount: amount,
            access_token: TSPAY_MERCHANT_TOKEN,
            redirect_url: window.location.origin, // To'lovdan keyin qaytish manzili
            comment: `Anilo ID: ${userId}`
        };

        const response = await fetch(CREATE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log("[TsPay] Server javobi status:", response.status);

        const responseText = await response.text();
        
        // HTML qaytishini tekshirish (ko'pincha Proxy yoki 404/500 xatolarda bo'ladi)
        if (responseText.includes("<!DOCTYPE html>") || responseText.includes("<html")) {
            console.error("[TsPay] Server HTML qaytardi (ehtimol Proxy yoki Endpoint xatosi). Javob:", responseText);
            throw new Error(`To'lov tizimi vaqtincha ishlamayapti (Status: ${response.status})`);
        }

        let data: any;
        try {
            data = JSON.parse(responseText.trim());
        } catch (e) {
            console.error("[TsPay] JSON Parse Error. Xom javob:", responseText);
            throw new Error("Server javobini o'qib bo'lmadi.");
        }

        if (!response.ok) {
            throw new Error(data.message || `HTTP Xatolik: ${response.status}`);
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
        throw new Error(error.message || "To'lov tizimiga ulanishda xatolik.");
    }
};

// 2. Tranzaksiya holatini tekshirish
export const checkTsPayStatus = async (chequeId: number): Promise<TsPayCheckResponse> => {
    try {
        // GET so'rovida parametrlarni URL ga qo'shamiz
        const endpoint = `${TSPAY_BASE_URL}/transactions/${chequeId}?access_token=${TSPAY_MERCHANT_TOKEN}`;
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const responseText = await response.text();
        
        if (responseText.includes("<!DOCTYPE html>")) {
             console.error("[TsPay] Status Check HTML qaytardi.");
             throw new Error("Statusni tekshirishda server xatosi.");
        }

        return JSON.parse(responseText.trim());
    } catch (error) {
        console.error("[TsPay] Check Status Error:", error);
        throw new Error("To'lov holatini tekshirib bo'lmadi.");
    }
};
