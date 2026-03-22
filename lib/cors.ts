const ALLOWED_ORIGINS = [
  'https://lm-agentis.vercel.app',
  'http://100.89.175.49:3008',
  'http://localhost:3008',
  'http://localhost:5173',
]

export function corsHeaders(req?: { headers: { get: (k: string) => string | null } }, methods = 'GET,POST,OPTIONS') {
  const origin = req?.headers.get('origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  }
}
