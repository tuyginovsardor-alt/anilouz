
// Deno muhiti uchun
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Dinamik Origin olish (CORS xatosini oldini olish uchun)
  const origin = req.headers.get('Origin') || '*';

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-application-name',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }

  // 2. Preflight so'roviga darhol ruxsat berish
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const tspayToken = Deno.env.get('TSPAY_TOKEN');

    if (!tspayToken) {
        throw new Error("TSPAY_TOKEN topilmadi. Secrets bo'limini tekshiring.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));

    // To'lov yaratish
    if (body.action === 'create') {
      const amount = Math.floor(Number(body.amount));
      const userId = body.user_id;

      const tsResponse = await fetch('https://tspay.uz/api/v1/transactions/create/', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
        },
        body: JSON.stringify({
          amount: amount,
          access_token: tspayToken,
          comment: `Anilo.uz ID: ${userId}`,
          redirect_url: `${origin}/dashboard/account` // So'rov kelgan origin'ga qaytaradi
        })
      });
      
      const data = await tsResponse.json();

      if (tsResponse.ok) {
          const payUrl = data.pay_url || data.url || (data.data && data.data.pay_url);
          if (payUrl) {
              return new Response(JSON.stringify({ 
                  status: 'success', 
                  transaction: { url: payUrl, id: data.id || (data.data && data.data.id) } 
              }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
      }
      
      return new Response(JSON.stringify({ 
          status: 'error', 
          message: data.message || `TsPay xatosi: ${tsResponse.status}` 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Webhook (To'lov tasdiqlanganda TsPay tomonidan chaqiriladi)
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

    return new Response(JSON.stringify({ status: 'error', message: 'Noma\'lum so\'rov' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    });
  }
})
