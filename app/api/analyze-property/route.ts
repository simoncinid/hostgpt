import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Valida che sia un URL valido
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Verifica che la chiave API sia configurata
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Analizza la pagina della proprietà
    const analysisResult = await analyzePropertyPage(url)
    
    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error('Error analyzing property:', error)
    return NextResponse.json(
      { error: 'Failed to analyze property' },
      { status: 500 }
    )
  }
}

async function analyzePropertyPage(url: string) {
  try {
    // Prima scarica il contenuto della pagina
    const pageContent = await fetchPageContent(url)
    
    if (!pageContent) {
      throw new Error('Could not fetch page content')
    }

    // Usa OpenAI per analizzare il contenuto e estrarre le informazioni
    const analysisResult = await analyzeWithOpenAI(pageContent, url)
    
    return analysisResult
  } catch (error) {
    console.error('Error in property analysis:', error)
    throw error
  }
}

async function fetchPageContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    
    // Estrae solo il testo visibile, rimuovendo script, style, etc.
    const textContent = extractTextFromHTML(html)
    
    return textContent
  } catch (error) {
    console.error('Error fetching page content:', error)
    return null
  }
}

function extractTextFromHTML(html: string): string {
  // Rimuove script, style, e altri tag non necessari
  const cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Limita la lunghezza per evitare token eccessivi
  return cleanHtml.substring(0, 8000)
}

async function analyzeWithOpenAI(pageContent: string, url: string) {
  // Importa e inizializza OpenAI solo quando necessario
  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const prompt = `
Analizza il contenuto di questa pagina di una proprietà di affitto vacanze e estrai tutte le informazioni disponibili.

URL: ${url}

Contenuto della pagina:
${pageContent}

Estrai le informazioni e restituisci SOLO un JSON valido con questa struttura esatta:

{
  "property_name": "Nome della proprietà",
  "property_type": "appartamento|villa|casa|stanza|loft|monolocale|bed_breakfast",
  "property_address": "Indirizzo completo",
  "property_city": "Città",
  "property_description": "Descrizione dettagliata della proprietà",
  "check_in_time": "Orario check-in (es. 15:00 - 20:00)",
  "check_out_time": "Orario check-out (es. 10:00)",
  "house_rules": "Regole della casa",
  "amenities": ["wifi", "aria_condizionata", "riscaldamento", "tv", "netflix", "cucina", "lavastoviglie", "lavatrice", "asciugatrice", "ferro", "parcheggio", "piscina", "palestra", "balcone", "giardino", "ascensore", "cassaforte", "allarme", "animali_ammessi", "fumatori_ammessi"],
  "neighborhood_description": "Descrizione del quartiere",
  "transportation_info": "Informazioni sui trasporti",
  "shopping_info": "Informazioni sui negozi e shopping",
  "parking_info": "Informazioni sul parcheggio",
  "special_instructions": "Istruzioni speciali",
  "welcome_message": "Messaggio di benvenuto",
  "nearby_attractions": [
    {
      "name": "Nome attrazione",
      "distance": "Distanza",
      "description": "Descrizione"
    }
  ],
  "restaurants_bars": [
    {
      "name": "Nome locale",
      "type": "Tipo (es. Ristorante, Bar)",
      "distance": "Distanza"
    }
  ],
  "emergency_contacts": [
    {
      "name": "Nome contatto",
      "number": "Numero di telefono",
      "type": "Tipo (es. Host, Emergenza, Polizia)"
    }
  ],
  "faq": [
    {
      "question": "Domanda frequente",
      "answer": "Risposta"
    }
  ],
  "wifi_info": {
    "network": "Nome rete WiFi",
    "password": "Password WiFi"
  }
}

IMPORTANTE:
- Restituisci SOLO il JSON, senza testo aggiuntivo
- Se un'informazione non è disponibile, usa una stringa vuota ""
- Per gli array, se non ci sono elementi, restituisci un array vuoto []
- Per gli amenities, usa solo i valori esatti dalla lista fornita
- Per property_type, usa solo uno dei valori esatti dalla lista
- Se non trovi informazioni specifiche, lascia il campo vuoto
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Sei un assistente esperto nell'analisi di pagine web di proprietà di affitto vacanze. Estrai le informazioni in modo preciso e restituisci solo JSON valido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })

    const responseText = completion.choices[0]?.message?.content?.trim()
    
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Prova a parsare il JSON
    try {
      const jsonResult = JSON.parse(responseText)
      return jsonResult
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      console.error('Response text:', responseText)
      
      // Prova a estrarre il JSON dal testo se è circondato da altro testo
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0])
        } catch (e) {
          throw new Error('Could not parse JSON from response')
        }
      }
      
      throw new Error('No valid JSON found in response')
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw error
  }
}

