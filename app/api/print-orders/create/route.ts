import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[DEBUG] Proxy API - Dati ricevuti:', body)
    
    // Estrai il token di autorizzazione
    const authHeader = request.headers.get('authorization')
    console.log('[DEBUG] Proxy API - Header autorizzazione:', authHeader ? 'Presente' : 'Mancante')
    
    if (!authHeader) {
      console.log('[ERROR] Proxy API - Token di autorizzazione mancante')
      return NextResponse.json({ error: 'Token di autorizzazione mancante' }, { status: 401 })
    }

    // Chiama il backend Python
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    console.log('[DEBUG] Proxy API - Backend URL:', backendUrl)
    console.log('[DEBUG] Proxy API - Chiamando backend...')
    
    const response = await fetch(`${backendUrl}/api/print-orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    })

    console.log('[DEBUG] Proxy API - Risposta backend:', response.status, response.statusText)

    if (!response.ok) {
      const errorData = await response.json()
      console.log('[ERROR] Proxy API - Errore backend:', errorData)
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    console.log('[DEBUG] Proxy API - Dati backend ricevuti:', data)
    return NextResponse.json(data)

  } catch (error) {
    console.error('[ERROR] Proxy API - Errore nel proxy API:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
