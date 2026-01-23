
// Deno global o'zgaruvchisini tanitish
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS (Frontenddan so'rov kelishi uchun shart)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, amount, cheque_id, user_id } = await req.json()
    
    // Dashboarddagi Secrets bo'limida saqlangan token
    const token = Deno.env.get('TSPAY_TOKEN')

    if (!token) {
        throw new Error("TSPAY_TOKEN topilmadi. Dashboardda Secrets-ni tekshiring.");
    }

    if (action === 'create') {
      const response = await fetch('https://tspay.uz/api/v1/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          access_token: token,
          comment: `Anilo.uz User ID: ${user_id}`,
          redirect_url: 'https://anilo.uz/dashboard'
        })
      })
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'check') {
      const response = await fetch(`https://tspay.uz/api/v1/transactions/${cheque_id}/?access_token=${token}`)
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Noma\'lum amal' }), { status: 400 })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
