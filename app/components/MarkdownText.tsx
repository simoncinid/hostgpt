'use client'

import React from 'react'

interface MarkdownTextProps {
  content: string
  className?: string
}

export default function MarkdownText({ content, className = '' }: MarkdownTextProps) {
  // Funzione per convertire stringa CSS in oggetto JavaScript
  const parseStyleString = (styleString: string): React.CSSProperties => {
    const styles: any = {}
    const declarations = styleString.split(';')
    
    declarations.forEach(declaration => {
      const [property, value] = declaration.split(':').map(s => s.trim())
      if (property && value) {
        // Converte kebab-case in camelCase
        const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
        styles[camelProperty] = value
      }
    })
    
    return styles
  }

  // Funzione per convertire markdown in JSX
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = []
    let currentIndex = 0
    
    // Regex per catturare grassetto, italic, link e immagini
    const patterns = [
      // Immagini HTML: <img src="..." alt="..." style="..." />
      {
        regex: /<img\s+src="([^"]+)"\s+alt="([^"]*)"(?:\s+style="([^"]*)")?\s*\/?>/g,
        render: (match: string, ...groups: string[]) => (
          <img
            key={`img-${Math.random()}`}
            src={groups[0]}
            alt={groups[1] || 'Image'}
            style={groups[2] ? { ...parseStyleString(groups[2]) } : {}}
            className="rounded-lg shadow-sm"
          />
        )
      },
      // URL diretti: http://... o https://...
      {
        regex: /(https?:\/\/[^\s]+)/g,
        render: (match: string, ...groups: string[]) => (
          <a
            key={`url-${Math.random()}`}
            href={match}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-700 underline font-medium"
          >
            {match}
          </a>
        )
      },
      // Link: [text](url)
      {
        regex: /\[([^\]]+)\]\(([^)]+)\)/g,
        render: (match: string, ...groups: string[]) => (
          <a
            key={`link-${Math.random()}`}
            href={groups[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-700 underline font-medium"
          >
            {groups[0]}
          </a>
        )
      },
      // Grassetto: **text** o __text__
      {
        regex: /\*\*([^*]+)\*\*|__([^_]+)__/g,
        render: (match: string, ...groups: string[]) => (
          <strong key={`bold-${Math.random()}`} className="font-bold text-purple-600">
            {groups[0] || groups[1]}
          </strong>
        )
      },
      // Italic: *text* o _text_
      {
        regex: /\*([^*]+)\*|_([^_]+)_/g,
        render: (match: string, ...groups: string[]) => (
          <em key={`italic-${Math.random()}`} className="italic">
            {groups[0] || groups[1]}
          </em>
        )
      }
    ]
    
    // Trova tutti i match e li ordina per posizione
    const allMatches: Array<{
      start: number
      end: number
      render: (match: string, ...groups: string[]) => React.ReactNode
      match: string
      groups: string[]
    }> = []
    
    patterns.forEach(pattern => {
      let match
      const regex = new RegExp(pattern.regex.source, 'g')
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          render: pattern.render,
          match: match[0],
          groups: match.slice(1)
        })
      }
    })
    
    // Ordina per posizione di inizio
    allMatches.sort((a, b) => a.start - b.start)
    
    // Rimuovi match sovrapposti (mantieni il primo)
    const filteredMatches = []
    let lastEnd = 0
    
    for (const match of allMatches) {
      if (match.start >= lastEnd) {
        filteredMatches.push(match)
        lastEnd = match.end
      }
    }
    
    // Costruisci il risultato
    let lastIndex = 0
    
    filteredMatches.forEach((match, index) => {
      // Aggiungi testo normale prima del match
      if (match.start > lastIndex) {
        const normalText = text.slice(lastIndex, match.start)
        if (normalText) {
          elements.push(
            <span key={`normal-${index}`}>
              {normalText}
            </span>
          )
        }
      }
      
      // Aggiungi il match formattato
      elements.push(match.render(match.match, ...match.groups))
      
      lastIndex = match.end
    })
    
    // Aggiungi testo normale finale
    if (lastIndex < text.length) {
      const finalText = text.slice(lastIndex)
      if (finalText) {
        elements.push(
          <span key="final">
            {finalText}
          </span>
        )
      }
    }
    
    return elements.length > 0 ? elements : [text]
  }
  
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {parseMarkdown(content)}
    </div>
  )
}
