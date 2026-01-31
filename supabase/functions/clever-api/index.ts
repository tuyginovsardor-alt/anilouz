
// Deno muhiti uchun
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS Sarlavhalari - Brauzer xatolarini oldini olish uchun
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Brauzer "Preflight" (OPTIONS) so'rovini yuborsa, darhol 'ok' qaytaramiz
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    const token = Deno.env.get('TSPAY_TOKEN')?.trim()

    if (!token) {
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: "Tizimda TSPAY_TOKEN o'rnatilmagan." 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // --- 1. WEBHOOK (TsPay to'lovni tasdiqlaganda) ---
    // TsPay odatda 'pay_status' yoki 'status' yuboradi
    if (body.status === 'paid' || body.pay_status === 'paid' || body.status === 'success') {
      const amount = Number(body.amount);
      const comment = body.comment || "";
      const orderId = body.id || body.cheque_id || 0;
      
      const userIdMatch = comment.match(/([a-f0-9-]{36})/i);
      const userId = userIdMatch ? userIdMatch[1] : null;

      if (userId && amount) {
        console.log(`[WEBHOOK] To'lov qabul: User ${userId}, Summa: ${amount}`);
        await supabaseAdmin.rpc('record_tspay_success', { u_id: userId, amt: amount, o_id: Number(orderId) });
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: corsHeaders });
    }

    // --- 2. CREATE TRANSACTION (Frontend chaqirganda) ---
    if (body.action === 'create') {
      const amount = Math.round(Number(body.amount));
      if (!amount || amount < 1000) {
          return new Response(JSON.stringify({ status: 'error', message: "Minimal summa 1000 so'm." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      console.log(`[TSPAY] So'rov: ${amount} UZS, User: ${body.user_id}`);

      const tsResponse = await fetch('https://tspay.uz/api/v1/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          access_token: token,
          comment: `Anilo ID: ${body.user_id}`,
          redirect_url: 'https://www.anilo.uz/dashboard'
        })
      });
      
      const resStatus = tsResponse.status;
      const data = await tsResponse.json().catch(() => ({ message: "TsPay javob bermadi" }));

      if ((resStatus === 200 || resStatus === 201) && (data.url || (data.data && data.data.url))) {
          const payUrl = data.url || data.data.url;
          return new Response(JSON.stringify({ 
              status: 'success', 
              transaction: { url: payUrl, id: data.id || (data.data && data.data.id) } 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      } else {
          console.error("[TSPAY ERROR]", data);
          return new Response(JSON.stringify({ 
              status: 'error', 
              message: data.message || data.error || `TsPay xatosi (Status: ${resStatus})`
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    return new Response(JSON.stringify({ status: 'error', message: 'Noma\'lum so\'rov' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error("[SERVER ERROR]", error);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
