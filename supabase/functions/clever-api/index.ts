
// Deno muhiti uchun
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const origin = req.headers.get('Origin') || '*';

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-application-name',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const tspayToken = Deno.env.get('TSPAY_TOKEN');

    if (!tspayToken) {
        throw new Error("TSPAY_TOKEN topilmadi.");
    }

    const body = await req.json().catch(() => ({}));

    if (body.action === 'create') {
      const amount = Math.floor(Number(body.amount));
      const userId = body.user_id;

      // TsPay API ga so'rov yuborish
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
          redirect_url: `${origin}/dashboard/account`
        })
      });
      
      const data = await tsResponse.json();
      console.log("TsPay Response Data:", data); // Supabase loglarida ko'rinadi

      // TsPay odatda status: true yoki success qaytaradi
      if (tsResponse.ok && (data.status === true || data.status === 'success' || data.pay_url)) {
          // Eng ko'p uchraydigan strukturalarni tekshiramiz
          const payUrl = data.pay_url || (data.data && data.data.pay_url) || data.url;
          
          if (payUrl) {
              return new Response(JSON.stringify({ 
                  status: 'success', 
                  transaction: { 
                      url: payUrl, 
                      id: data.id || (data.data && data.data.id) 
                  } 
              }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
      }
      
      return new Response(JSON.stringify({ 
          status: 'error', 
          message: data.message || data.error || `TsPay xatosi: ${tsResponse.status}` 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Webhook qismi (TsPay tomonidan chaqiriladi)
    if (body.pay_status === 'paid' || body.status === 'success') {
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
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

    return new Response(JSON.stringify({ status: 'error', message: 'Noma\'lum amal' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    });
  }
})
