import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { corsHeaders } from '@/lib/cors'
import { getUserId } from '@/lib/auth'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req, 'POST,OPTIONS') })
}

export async function POST(req: NextRequest) {
  const CORS = corsHeaders(req, 'POST,OPTIONS')
  const body = await req.json()
  const { connectionId, userId: bodyUserId } = body
  const userId = (await getUserId(req)) ?? bodyUserId

  if (!connectionId || !userId) {
    return Response.json({ error: 'connectionId y userId requeridos' }, { status: 400, headers: CORS })
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, nango_connection_id: connectionId }, { onConflict: 'id' })

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS })
  }

  return Response.json({ ok: true }, { headers: CORS })
}
