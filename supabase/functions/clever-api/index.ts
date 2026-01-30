
// Deno muhiti uchun
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const rawToken = Deno.env.get('TSPAY_TOKEN');
    const token = rawToken ? rawToken.trim() : null;

    if (!token) {
        console.error("CRITICAL: TSPAY_TOKEN is missing in Edge Function secrets.");
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: "Tizim sozlamalarida xatolik (Token missing)." 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // 1. Webhook (TsPay'dan keladigan tasdiqlash)
    if (!body.action && (body.pay_status || body.status)) {
      const status = body.pay_status || body.status;
      if (status === 'paid' || status === 'success') {
        const amount = Number(body.amount);
        const comment = body.comment || "";
        const orderId = body.id || body.cheque_id || 0;
        
        // Komment ichidan User ID ni ajratib olish (UUID formatini qidiramiz)
        const userIdMatch = comment.match(/([a-f0-9-]{36})/i);
        const userId = userIdMatch ? userIdMatch[1] : null;

        if (userId && amount) {
          console.log(`Processing SUCCESS payment: User ${userId}, Amount ${amount}`);
          await supabaseAdmin.rpc('record_tspay_success', { 
            u_id: userId, 
            amt: amount, 
            o_id: Number(orderId) 
          });
        }
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: corsHeaders });
    }

    // 2. To'lov yaratish (Frontend'dan keladi)
    if (body.action === 'create') {
      const amount = Math.floor(Number(body.amount));
      const TSPAY_API_URL = 'https://tspay.uz/api/v1/transactions/create/';

      console.log(`Creating transaction for user ${body.user_id}, amount ${amount}`);

      const tsResponse = await fetch(TSPAY_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          access_token: token,
          comment: `Anilo.uz: ${body.user_id}`,
          redirect_url: 'https://anilo.uz/dashboard/account'
        })
      });
      
      const data = await tsResponse.json();
      const isOk = tsResponse.status === 200 || tsResponse.status === 201;
      
      /**
       * Deep Search: TsPay ba'zan JSON tuzilishini o'zgartiradi. 
       * Ushbu funksiya har qanday chuqurlikdan pay_url yoki checkout linkini topadi.
       */
      const findUrlDeep = (obj: any): string | null => {
          if (!obj || typeof obj !== 'object') return null;
          
          const priorityKeys = ['pay_url', 'url', 'payment_url', 'link', 'pay_link', 'payment_page_url', 'checkout_url'];
          for (const key of priorityKeys) {
              if (typeof obj[key] === 'string' && obj[key].startsWith('http')) return obj[key];
          }

          for (const key in obj) {
              if (typeof obj[key] === 'string' && (obj[key].includes('checkout.tspay.uz') || obj[key].includes('tspay.uz/pay/'))) {
                  return obj[key];
              }
              if (typeof obj[key] === 'object') {
                  const found = findUrlDeep(obj[key]);
                  if (found) return found;
              }
          }
          return null;
      };

      const payUrl = findUrlDeep(data);
      const transactionId = data.id || (data.data && data.data.id) || (data.result && data.result.id) || data.cheque_id;

      if (isOk && payUrl) {
          return new Response(JSON.stringify({ 
              status: 'success', 
              transaction: { url: payUrl, id: transactionId } 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      } else {
          const errorMsg = data.message || data.error || (data.data && data.data.error);
          console.error("TsPay API Error:", JSON.stringify(data));
          return new Response(JSON.stringify({ 
              status: 'error', 
              message: errorMsg || `TsPay tizimi havola bermadi (Status: ${tsResponse.status}).` 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    // 3. To'lov holatini tekshirish
    if (body.action === 'check') {
      const response = await fetch(`https://tspay.uz/api/v1/transactions/${body.cheque_id}/?access_token=${token}`)
      const data = await response.json()
      return new Response(JSON.stringify({ status: 'success', data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ status: 'error', message: 'Noma\'lum amal' }), { status: 200 });

  } catch (error: any) {
    console.error("Global Function Error:", error);
    return new Response(JSON.stringify({ status: 'error', message: "Server xatosi: " + error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
