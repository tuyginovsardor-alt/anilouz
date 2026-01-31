
// Deno muhiti uchun
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS so'rovlarini boshqarish (Frontend uchun zarur)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    
    // TSPAY_TOKEN ni olish va tozalash
    const rawToken = Deno.env.get('TSPAY_TOKEN')
    const token = rawToken ? rawToken.trim() : null

    if (!token) {
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: "XATOLIK: Supabase Secrets-da 'TSPAY_TOKEN' topilmadi. Iltimos, dashboarddan kalitni qo'shing." 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // 1. Webhook logikasi (TsPay to'lovni tasdiqlaganda chaqiradi)
    if (!body.action && (body.pay_status || body.status)) {
      const status = body.pay_status || body.status;
      if (status === 'paid' || status === 'success') {
        const amount = Number(body.amount);
        const comment = body.comment || "";
        const orderId = body.id || body.cheque_id || 0;
        
        // User ID ni ajratib olish
        const userIdMatch = comment.match(/([a-f0-9-]{36})/i);
        const userId = userIdMatch ? userIdMatch[1] : null;

        if (userId && amount) {
          console.log(`[TsPay Success] User: ${userId}, Amount: ${amount}`);
          await supabaseAdmin.rpc('record_tspay_success', { u_id: userId, amt: amount, o_id: Number(orderId) });
        }
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: corsHeaders });
    }

    // 2. To'lov yaratish (Frontend chaqiradi)
    if (body.action === 'create') {
      const amount = Math.floor(Number(body.amount));
      if (!amount || amount < 1000) {
          return new Response(JSON.stringify({ status: 'error', message: "Minimal summa 1000 so'm bo'lishi kerak." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const TSPAY_API_URL = 'https://tspay.uz/api/v1/transactions/create';

      console.log(`TsPay-ga so'rov yuborilmoqda: ${amount} UZS, User: ${body.user_id}`);

      const tsResponse = await fetch(TSPAY_API_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Accept': 'application/json' 
        },
        body: JSON.stringify({
          amount: amount,
          access_token: token,
          comment: `Anilo ID: ${body.user_id}`,
          redirect_url: 'https://www.anilo.uz/dashboard'
        })
      });
      
      const resStatus = tsResponse.status;
      let data: any;
      
      try {
          data = await tsResponse.json();
      } catch (e) {
          return new Response(JSON.stringify({ 
              status: 'error', 
              message: `TsPay serveri tushunarsiz javob qaytardi (HTTP ${resStatus}).` 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }

      console.log(`TsPay API Result (${resStatus}):`, JSON.stringify(data));

      if ((resStatus === 200 || resStatus === 201) && (data.url || data.pay_url || data.link || (data.data && data.data.url))) {
          const payUrl = data.url || data.pay_url || data.link || (data.data && data.data.url);
          return new Response(JSON.stringify({ 
              status: 'success', 
              transaction: { url: payUrl, id: data.id || data.cheque_id || 0 } 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      } else {
          // TsPay rad etsa, sababini frontendga beramiz
          const errorMsg = data.message || data.error || data.detail || `TsPay rad etdi (HTTP ${resStatus}). Token yoki redirect_url xato bo'lishi mumkin.`;
          return new Response(JSON.stringify({ 
              status: 'error', 
              message: errorMsg
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    return new Response(JSON.stringify({ status: 'error', message: 'Noma\'lum amal yuborildi.' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    });

  } catch (error: any) {
    console.error("Critical Function Error:", error);
    return new Response(JSON.stringify({ status: 'error', message: "Tizimda ichki xato: " + error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });
  }
})
