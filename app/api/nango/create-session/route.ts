import { NextRequest } from 'next/server'
import { corsHeaders } from '@/lib/cors'
import { getUserId } from '@/lib/auth'

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req, 'POST,OPTIONS') })
}

export async function POST(req: NextRequest) {
  const CORS = corsHeaders(req, 'POST,OPTIONS')
  const userId = await getUserId(req)
  if (!userId) {
    return Response.json({ error: 'No autorizado' }, { status: 401, headers: CORS })
  }

  const res = await fetch('https://api.nango.dev/connect/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NANGO_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      end_user: { id: userId },
      allowed_integrations: ['google-workspace'],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return Response.json({ error: `Nango error: ${err}` }, { status: 500, headers: CORS })
  }

  const data = await res.json()
  return Response.json({ sessionToken: data.token }, { headers: CORS })
}
