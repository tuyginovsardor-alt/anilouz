
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

    const body = await req.json().catch(() => ({}))
    const rawToken = Deno.env.get('TSPAY_TOKEN')
    const token = rawToken ? rawToken.trim() : null

    if (!token) {
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: "Supabase Secrets-da TSPAY_TOKEN topilmadi." 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // 1. Webhook (To'lov tasdiqlanganda)
    if (!body.action && (body.pay_status || body.status)) {
      const status = body.pay_status || body.status;
      if (status === 'paid' || status === 'success') {
        const amount = Number(body.amount);
        const comment = body.comment || "";
        const orderId = body.id || body.cheque_id || 0;
        // User ID ni izohdan ajratib olish (Format: Anilo ID: uuid)
        const userIdMatch = comment.match(/([a-f0-9-]{36})/i);
        const userId = userIdMatch ? userIdMatch[1] : null;

        if (userId && amount) {
          await supabaseAdmin.rpc('record_tspay_success', { u_id: userId, amt: amount, o_id: Number(orderId) });
        }
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: corsHeaders });
    }

    // 2. To'lov yaratish
    if (body.action === 'create') {
      const amount = Math.floor(Number(body.amount));
      // Oxirgi slashesiz URL ishlatib ko'ramiz
      const TSPAY_API_URL = 'https://tspay.uz/api/v1/transactions/create';

      console.log(`TsPay so'rov: ${amount} UZS, User: ${body.user_id}`);

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
          redirect_url: 'https://anilo.uz/dashboard'
        })
      });
      
      const resStatus = tsResponse.status;
      const data = await tsResponse.json();
      console.log(`TsPay API Result (${resStatus}):`, JSON.stringify(data));

      if ((resStatus === 200 || resStatus === 201) && (data.url || data.pay_url || data.link)) {
          const payUrl = data.url || data.pay_url || data.link || (data.data && data.data.url);
          return new Response(JSON.stringify({ 
              status: 'success', 
              transaction: { url: payUrl, id: data.id || data.cheque_id || 0 } 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      } else {
          // Xatolik xabarini TsPay dan kelgan javob asosida aniqlaymiz
          const errorMsg = data.message || data.error || data.detail || `TsPay rad etdi (Status: ${resStatus}). Tokenni tekshiring.`;
          return new Response(JSON.stringify({ 
              status: 'error', 
              message: errorMsg
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    return new Response(JSON.stringify({ status: 'error', message: 'Unknown action' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    });

  } catch (error: any) {
    console.error("Critical Edge Function Error:", error);
    return new Response(JSON.stringify({ status: 'error', message: "Tizim xatosi: " + error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });
  }
})
