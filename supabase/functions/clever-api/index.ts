
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
    console.log("Kiruvchi so'rov:", body)

    // 1. TsPay WEBHOOK (To'lov yakunlanganda TsPay serveridan keladi)
    const isWebhook = !body.action && (body.pay_status || body.status);
    
    if (isWebhook) {
      const status = body.pay_status || body.status;
      const amount = Number(body.amount);
      const comment = body.comment || "";
      const orderId = body.id || body.cheque_id || 0;

      if (status === 'paid' || status === 'success') {
        // Comment ichidan User UUID ni ajratish
        const userIdMatch = comment.match(/([a-f0-9-]{36})/i);
        const userId = userIdMatch ? userIdMatch[1] : null;

        if (userId && amount) {
          const { error: rpcError } = await supabaseAdmin.rpc('record_tspay_success', {
            u_id: userId,
            amt: amount,
            o_id: Number(orderId)
          });

          if (rpcError) {
            console.error("RPC Error:", rpcError);
            return new Response(JSON.stringify({ error: "DB Error" }), { status: 500 });
          }
          console.log(`Muvaffaqiyatli: User ${userId} +${amount} UZS`);
        }
      }
      
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. FRONTEND SO'ROVLARI (To'lov yaratish)
    const token = Deno.env.get('TSPAY_TOKEN')

    if (body.action === 'create') {
      const response = await fetch('https://tspay.uz/api/v1/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: body.amount,
          access_token: token,
          comment: `Anilo.uz. User ID: ${body.user_id}`,
          redirect_url: 'https://www.anilo.uz/dashboard/account'
        })
      })
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 3. FRONTEND SO'ROVLARI (Holatni tekshirish - fallback)
    if (body.action === 'check') {
      const response = await fetch(`https://tspay.uz/api/v1/transactions/${body.cheque_id}/?access_token=${token}`)
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Noma\'lum amal' }), { status: 400 })

  } catch (error) {
    console.error("Global Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
