import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Endpoint di test senza autenticazione
export async function GET() {
  return NextResponse.json({ message: 'API analyze-property funziona!' })
}

// Funzione per ottenere la sessione in modo sicuro
async function getSessionSafely() {
  try {
    return await getServerSession(authOptions)
  } catch (error) {
    console.error('❌ Errore nel getServerSession:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API analyze-property chiamata')
    
    const { url } = await request.json()
    console.log('🔍 URL ricevuto:', url)
    
    if (!url) {
      return NextResponse.json({ error: 'URL richiesto' }, { status: 400 })
    }

    // Valida che sia un URL valido
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'URL non valido' }, { status: 400 })
    }

    // Chiama il backend Python - come tutte le altre API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    console.log('🔍 Chiamando backend:', `${backendUrl}/api/analyze-property`)
    console.log('🔍 URL da analizzare:', url)
    
    const response = await fetch(`${backendUrl}/api/analyze-property`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })
    
    console.log('🔍 Risposta backend status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Errore sconosciuto' }))
      console.log('❌ Backend error:', errorData)
      return NextResponse.json(
        { error: errorData.detail || errorData.error || 'Errore nell\'analisi della proprietà' },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('🔍 Risultato backend:', result)
    
    if (result.status === 'success') {
      return NextResponse.json(result.data)
    } else {
      return NextResponse.json(
        { error: 'Errore nell\'analisi della proprietà' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ API: Error analyzing property completo:', error)
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
    return NextResponse.json(
      { error: `Errore nell'analisi della proprietà: ${errorMessage}` },
      { status: 500 }
    )
  }
}

