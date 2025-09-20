import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 })
    }
    
    // Verifica tipo file
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.oasis.opendocument.text', // ODT
      'text/plain' // TXT
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Formato file non supportato. Usa PDF, DOCX, ODT o TXT' 
      }, { status: 400 })
    }
    
    // Verifica dimensione (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Il file non può superare i 10MB' 
      }, { status: 400 })
    }
    
    // Chiama il backend Python per l'estrazione del contenuto
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    // Crea FormData per il backend
    const backendFormData = new FormData()
    backendFormData.append('file', file)
    
    const response = await fetch(`${backendUrl}/api/extract-document`, {
      method: 'POST',
      body: backendFormData
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Errore sconosciuto' }))
      return NextResponse.json(
        { error: errorData.detail || errorData.error || 'Errore nell\'estrazione del contenuto' },
        { status: response.status }
      )
    }
    
    const result = await response.json()
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error in document extraction API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
    return NextResponse.json(
      { error: `Errore nell'elaborazione del documento: ${errorMessage}` },
      { status: 500 }
    )
  }
}
