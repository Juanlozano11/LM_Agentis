import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { verifyToken } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const CORS = {
  'Access-Control-Allow-Origin': 'https://florentina-unnitrogenized-responsibly.ngrok-free.dev',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! })
      return payload.sub ?? null
    } catch {}
  }
  return req.nextUrl.searchParams.get('userId')
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const userId = await resolveUserId(req)
  if (!userId) return Response.json({ connected: false }, { headers: CORS })

  const { data } = await supabase
    .from('profiles')
    .select('nango_connection_id')
    .eq('id', userId)
    .single()

  return Response.json({ connected: !!data?.nango_connection_id, userId }, { headers: CORS })
}
