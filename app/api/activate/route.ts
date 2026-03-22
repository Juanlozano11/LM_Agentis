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

  const userId = await getUserId(req)
  if (!userId) {
    return Response.json({ error: 'No autorizado' }, { status: 401, headers: CORS })
  }

  const body = await req.json()
  const { agentId, agentName } = body

  if (!agentId) {
    return Response.json({ error: 'agentId requerido' }, { status: 400, headers: CORS })
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, active_agent: agentId }, { onConflict: 'id' })

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500, headers: CORS })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nango_connection_id')
    .eq('id', userId)
    .single()

  const googleConnected = !!profile?.nango_connection_id

  return Response.json({
    ok: true,
    agentId,
    agentName,
    googleConnected,
    requiresGoogleAuth: !googleConnected,
  }, { headers: CORS })
}
