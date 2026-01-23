
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
    const token = Deno.env.get('TSPAY_TOKEN')

    if (!token) {
        throw new Error("TSPAY_TOKEN topilmadi. Secrets o'rnatilganini tekshiring.");
    }

    // 1. TsPay WEBHOOK (To'lov amalga oshirilganda chaqiriladi)
    const isWebhook = !body.action && (body.pay_status || body.status);
    if (isWebhook) {
      const status = body.pay_status || body.status;
      const amount = Number(body.amount);
      const comment = body.comment || "";
      const orderId = body.id || body.cheque_id || 0;

      if (status === 'paid' || status === 'success') {
        const userIdMatch = comment.match(/([a-f0-9-]{36})/i);
        const userId = userIdMatch ? userIdMatch[1] : null;

        if (userId && amount) {
          const { error: rpcError } = await supabaseAdmin.rpc('record_tspay_success', {
            u_id: userId,
            amt: amount,
            o_id: Number(orderId)
          });
          if (rpcError) throw rpcError;
        }
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // 2. FRONTEND: To'lov yaratish
    if (body.action === 'create') {
      const response = await fetch('https://tspay.uz/api/v1/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.floor(Number(body.amount)), // Butun son bo'lishi shart
          access_token: token,
          comment: `Anilo.uz. User ID: ${body.user_id}`,
          redirect_url: 'https://www.anilo.uz/dashboard/account'
        })
      })
      
      const data = await response.json();
      console.log("TsPay create response:", data);

      // TsPay odatda muvaffaqiyatli bo'lsa 'pay_url' yoki 'url' qaytaradi
      const payUrl = data.pay_url || data.url;
      
      if (payUrl) {
          return new Response(JSON.stringify({ 
              status: 'success', 
              transaction: { url: payUrl, id: data.id || data.cheque_id } 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      } else {
          return new Response(JSON.stringify({ 
              status: 'error', 
              message: data.message || "TsPay serveri to'lovni rad etdi (Summa xato yoki Token xato)" 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    // 3. FRONTEND: Tekshirish (Manual status check)
    if (body.action === 'check') {
      const response = await fetch(`https://tspay.uz/api/v1/transactions/${body.cheque_id}/?access_token=${token}`)
      const data = await response.json()
      return new Response(JSON.stringify({ status: 'success', data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ status: 'error', message: 'Noma\'lum amal' }), { status: 400 })

  } catch (error: any) {
    console.error("Global Error:", error.message)
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
