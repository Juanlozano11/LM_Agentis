import { NextRequest } from 'next/server'
import { verifyToken } from '@clerk/nextjs/server'

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
