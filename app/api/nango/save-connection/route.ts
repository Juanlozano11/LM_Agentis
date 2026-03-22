import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { verifyToken } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const CORS = {
  'Access-Control-Allow-Origin': 'https://florentina-unnitrogenized-responsibly.ngrok-free.dev',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! })
    return payload.sub ?? null
  } catch {
    return null
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
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
