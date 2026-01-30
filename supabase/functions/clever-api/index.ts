
// Deno muhiti
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // 1. OPTIONS (Preflight) so'roviga darhol javob berish
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Tizim tomonidan avtomatik beriladigan kalitlar
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const tspayToken = Deno.env.get('TSPAY_TOKEN') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));

    // Test so'rovi (funksiya tirikligini tekshirish uchun)
    if (body.action === 'ping') {
        return new Response(JSON.stringify({ status: 'pong', message: 'Funksiya ishlamoqda!' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 2. To'lov yaratish
    if (body.action === 'create') {
      const amount = Math.floor(Number(body.amount));
      const userId = body.user_id;

      if (!amount || !userId) {
          return new Response(JSON.stringify({ status: 'error', message: 'Ma\'lumotlar chala.' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }

      const tsResponse = await fetch('https://tspay.uz/api/v1/transactions/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          access_token: tspayToken,
          comment: `Anilo.uz user: ${userId}`,
          redirect_url: 'https://anilo.uz/dashboard/account'
        })
      });
      
      const data = await tsResponse.json();

      if (tsResponse.ok) {
          const payUrl = data.pay_url || data.url || (data.data && data.data.pay_url);
          const transactionId = data.id || (data.data && data.data.id) || data.cheque_id;

          if (payUrl) {
              return new Response(JSON.stringify({ 
                  status: 'success', 
                  transaction: { url: payUrl, id: transactionId } 
              }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
      }
      
      return new Response(JSON.stringify({ status: 'error', message: data.message || 'TsPay xatosi.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Webhook logikasi (TsPay'dan keladigan tasdiqlash)
    if (body.pay_status === 'paid' || body.status === 'success') {
        const comment = body.comment || "";
        const userIdMatch = comment.match(/([a-f0-9-]{36})/i);
        if (userIdMatch) {
            await supabaseAdmin.rpc('record_tspay_success', { 
                u_id: userIdMatch[1], 
                amt: Number(body.amount), 
                o_id: Number(body.id || 0) 
            });
        }
        return new Response(JSON.stringify({ status: 'ok' }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ status: 'error', message: 'Noma\'lum so\'rov.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
