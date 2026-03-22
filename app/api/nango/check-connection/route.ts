import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { corsHeaders } from '@/lib/cors'
import { getUserId } from '@/lib/auth'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req, 'GET,OPTIONS') })
}

export async function GET(req: NextRequest) {
  const CORS = corsHeaders(req, 'GET,OPTIONS')
  const userId = (await getUserId(req)) ?? req.nextUrl.searchParams.get('userId')
  if (!userId) return Response.json({ connected: false }, { headers: CORS })

  const { data } = await supabase
    .from('profiles')
    .select('nango_connection_id')
    .eq('id', userId)
    .single()

  return Response.json({ connected: !!data?.nango_connection_id, userId }, { headers: CORS })
}
