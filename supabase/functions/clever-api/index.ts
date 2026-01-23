
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
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: "Tizimda API Token o'rnatilmagan (Secret is null)." 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // 1. TsPay WEBHOOK
    if (!body.action && (body.pay_status || body.status)) {
      console.log("Webhook received:", body);
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
          if (rpcError) console.error("RPC Error:", rpcError);
        }
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // 2. FRONTEND: To'lov yaratish
    if (body.action === 'create') {
      const amount = Math.floor(Number(body.amount));
      
      console.log(`TsPay Request: Summa=${amount}, Token=${token.substring(0, 5)}...`);

      const tsResponse = await fetch('https://tspay.uz/api/v1/transactions/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          access_token: token,
          comment: `Anilo.uz ID: ${body.user_id}`,
          redirect_url: 'https://anilo.uz/dashboard/account'
        })
      });

      // Agar TsPay JSON qaytarmasa (masalan 503 HTML xatosi)
      const contentType = tsResponse.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await tsResponse.json();
          if (tsResponse.ok && (data.pay_url || data.url)) {
              return new Response(JSON.stringify({ 
                  status: 'success', 
                  transaction: { url: data.pay_url || data.url, id: data.id || data.cheque_id } 
              }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
          } else {
              return new Response(JSON.stringify({ 
                  status: 'error', 
                  message: `TsPay API Error: ${data.message || JSON.stringify(data)}` 
              }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
          }
      } else {
          // 503 yoki HTML xatolarni o'qish
          const errorText = await tsResponse.text();
          console.error("TsPay Non-JSON Error:", errorText);
          return new Response(JSON.stringify({ 
              status: 'error', 
              message: `TsPay Server Error (${tsResponse.status}): TsPay serveri vaqtincha ishlamayapti yoki so'rov rad etildi.` 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    // 3. FRONTEND: Tekshirish
    if (body.action === 'check') {
      const response = await fetch(`https://tspay.uz/api/v1/transactions/${body.cheque_id}/?access_token=${token}`)
      const data = await response.json()
      return new Response(JSON.stringify({ status: 'success', data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ status: 'error', message: 'Noma\'lum amal' }), { status: 200 })

  } catch (error: any) {
    console.error("Critical Function Error:", error.message);
    return new Response(JSON.stringify({ 
        status: 'error', 
        message: "Serverda ichki xatolik: " + error.message 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  }
})
