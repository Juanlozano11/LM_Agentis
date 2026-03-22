const NANGO_BASE = 'https://api.nango.dev/proxy'
const PROVIDER_CONFIG_KEY = 'google-workspace'

function nangoHeaders(connectionId: string) {
  return {
    Authorization: `Bearer ${process.env.NANGO_SECRET_KEY}`,
    'Connection-Id': connectionId,
    'Provider-Config-Key': PROVIDER_CONFIG_KEY,
    'Content-Type': 'application/json',
  }
}

export async function leerEmails(connectionId: string): Promise<any[]> {
  const listRes = await fetch(
    `${NANGO_BASE}/gmail/v1/users/me/messages?maxResults=10`,
    { headers: nangoHeaders(connectionId) }
  )
  const listData = await listRes.json()
  const messages = listData.messages || []

  const full = await Promise.all(
    messages.map((m: { id: string }) =>
      fetch(`${NANGO_BASE}/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {
        headers: nangoHeaders(connectionId),
      }).then(r => r.json())
    )
  )

  return full.map((e: any) => ({
    id: e.id,
    snippet: e.snippet,
    subject: e.payload?.headers?.find((h: any) => h.name === 'Subject')?.value,
    from: e.payload?.headers?.find((h: any) => h.name === 'From')?.value,
    date: e.payload?.headers?.find((h: any) => h.name === 'Date')?.value,
  }))
}

export async function responderEmail(connectionId: string, emailId: string, texto: string): Promise<void> {
  const raw = Buffer.from(
    `Content-Type: text/plain\r\nIn-Reply-To: ${emailId}\r\n\r\n${texto}`
  ).toString('base64url')

  await fetch(`${NANGO_BASE}/gmail/v1/users/me/messages/send`, {
    method: 'POST',
    headers: nangoHeaders(connectionId),
    body: JSON.stringify({ raw, threadId: emailId }),
  })
}

export async function crearDocumento(connectionId: string, titulo: string, contenido: string): Promise<any> {
  const createRes = await fetch(`${NANGO_BASE}/docs/v1/documents`, {
    method: 'POST',
    headers: nangoHeaders(connectionId),
    body: JSON.stringify({ title: titulo }),
  })
  const doc = await createRes.json()

  await fetch(`${NANGO_BASE}/docs/v1/documents/${doc.documentId}:batchUpdate`, {
    method: 'POST',
    headers: nangoHeaders(connectionId),
    body: JSON.stringify({
      requests: [{ insertText: { location: { index: 1 }, text: contenido } }],
    }),
  })
  return { documentId: doc.documentId, title: titulo }
}

export async function crearPresentacion(connectionId: string, titulo: string, slides: any[]): Promise<any> {
  const res = await fetch(`${NANGO_BASE}/slides/v1/presentations`, {
    method: 'POST',
    headers: nangoHeaders(connectionId),
    body: JSON.stringify({ title: titulo }),
  })
  const pres = await res.json()
  return { presentationId: pres.presentationId, title: titulo }
}

export async function crearEvento(
  connectionId: string,
  titulo: string,
  fecha: string,
  hora: string
): Promise<any> {
  const start = `${fecha}T${hora}:00`
  const [h, m] = hora.split(':').map(Number)
  const endHour = String(h + 1).padStart(2, '0')
  const end = `${fecha}T${endHour}:${String(m).padStart(2, '0')}:00`

  const res = await fetch(`${NANGO_BASE}/calendar/v3/calendars/primary/events`, {
    method: 'POST',
    headers: nangoHeaders(connectionId),
    body: JSON.stringify({
      summary: titulo,
      start: { dateTime: start, timeZone: 'America/Bogota' },
      end: { dateTime: end, timeZone: 'America/Bogota' },
    }),
  })
  const evt = await res.json()
  return { eventId: evt.id, title: titulo, start, end }
}

export async function buscarEnDrive(connectionId: string, query: string): Promise<any[]> {
  const res = await fetch(
    `${NANGO_BASE}/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink,modifiedTime)&pageSize=10`,
    { headers: nangoHeaders(connectionId) }
  )
  const data = await res.json()
  return data.files || []
}

export async function crearSheet(connectionId: string, titulo: string, datos: any[][]): Promise<any> {
  const res = await fetch(`${NANGO_BASE}/sheets/v4/spreadsheets`, {
    method: 'POST',
    headers: nangoHeaders(connectionId),
    body: JSON.stringify({
      properties: { title: titulo },
      sheets: [{
        data: [{
          rowData: datos.map(row => ({
            values: row.map(v => ({ userEnteredValue: { stringValue: String(v) } }))
          }))
        }]
      }],
    }),
  })
  const sheet = await res.json()
  return { spreadsheetId: sheet.spreadsheetId, title: titulo }
}
