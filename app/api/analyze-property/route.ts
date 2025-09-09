import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API analyze-property chiamata')
    
    // Verifica l'autenticazione
    const session = await getServerSession(authOptions)
    console.log('🔍 Session:', session ? 'Presente' : 'Assente')
    console.log('🔍 User email:', session?.user?.email)
    console.log('🔍 Access token:', session?.user?.accessToken ? 'Presente' : 'Assente')
    
    if (!session?.user?.email) {
      console.log('❌ Errore: Non autorizzato')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL richiesto' }, { status: 400 })
    }

    // Valida che sia un URL valido
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'URL non valido' }, { status: 400 })
    }

    // Chiama il backend Python
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8001'
    console.log('🔍 Chiamando backend:', `${backendUrl}/api/analyze-property`)
    console.log('🔍 URL da analizzare:', url)
    
    const response = await fetch(`${backendUrl}/api/analyze-property`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.accessToken}`,
      },
      body: JSON.stringify({ url }),
    })
    
    console.log('🔍 Risposta backend status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Errore sconosciuto' }))
      return NextResponse.json(
        { error: errorData.detail || errorData.error || 'Errore nell\'analisi della proprietà' },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    if (result.status === 'success') {
      return NextResponse.json(result.data)
    } else {
      return NextResponse.json(
        { error: 'Errore nell\'analisi della proprietà' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error analyzing property:', error)
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
    return NextResponse.json(
      { error: `Errore nell'analisi della proprietà: ${errorMessage}` },
      { status: 500 }
    )
  }
}

