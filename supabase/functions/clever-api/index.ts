
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
            message: "API Token topilmadi. Supabase Secrets-dan TSPAY_TOKEN ni sozlang." 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // 1. Webhook (To'lov tasdiqlanganda)
    if (!body.action && (body.pay_status || body.status)) {
      const status = body.pay_status || body.status;
      if (status === 'paid' || status === 'success') {
        const amount = Number(body.amount);
        const comment = body.comment || "";
        const orderId = body.id || body.cheque_id || 0;
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
      const TSPAY_API_URL = 'https://tspay.uz/api/v1/transactions/create/';

      console.log(`TsPay so'rov yuborilmoqda: ${amount} UZS, User: ${body.user_id}`);

      const tsResponse = await fetch(TSPAY_API_URL, {
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
      
      const resStatus = tsResponse.status;
      const data = await tsResponse.json();
      console.log(`TsPay Javobi (Status ${resStatus}):`, JSON.stringify(data));

      // 200 OK va 201 Created statuslari muvaffaqiyatli deb hisoblanadi
      const isOk = resStatus === 200 || resStatus === 201;
      
      /**
       * Deep Search: Javob ichidan URL ni qidirib topish
       */
      const findUrlDeep = (obj: any): string | null => {
          if (!obj || typeof obj !== 'object') return null;
          
          // 1-ustuvorlik: Mashhur kalit nomlari
          const priorityKeys = ['pay_url', 'url', 'payment_url', 'link', 'pay_link', 'checkout_url'];
          for (const key of priorityKeys) {
              if (typeof obj[key] === 'string' && obj[key].startsWith('http')) return obj[key];
          }

          // 2-ustuvorlik: TsPay domeniga mos keluvchi har qanday string
          for (const key in obj) {
              const val = obj[key];
              if (typeof val === 'string' && (val.startsWith('https://checkout.tspay.uz') || val.includes('/pay/'))) {
                  return val;
              }
              if (typeof val === 'object' && val !== null) {
                  const found = findUrlDeep(val);
                  if (found) return found;
              }
          }
          return null;
      };

      const payUrl = findUrlDeep(data);
      const transactionId = data.id || (data.data && data.data.id) || data.cheque_id || 0;

      if (isOk && payUrl) {
          return new Response(JSON.stringify({ 
              status: 'success', 
              transaction: { url: payUrl, id: transactionId } 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      } else {
          const errorMsg = data.message || data.error || (data.data && data.data.error) || `To'lov havolasi topilmadi (Status: ${resStatus})`;
          return new Response(JSON.stringify({ 
              status: 'error', 
              message: errorMsg
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    return new Response(JSON.stringify({ status: 'error', message: 'Noma\'lum amal' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    });

  } catch (error: any) {
    console.error("Edge Function Xatosi:", error);
    return new Response(JSON.stringify({ status: 'error', message: "Tizim xatosi: " + error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });
  }
})
