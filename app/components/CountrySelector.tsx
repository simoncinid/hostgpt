'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

interface CountryCode {
  code: string
  country: string
  flag: string
  name: string
}

interface CountrySelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  isDarkMode?: boolean
  language?: 'IT' | 'ENG'
}

export default function CountrySelector({ 
  value, 
  onChange, 
  placeholder,
  className = "",
  isDarkMode = false,
  language = 'IT'
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [countries, setCountries] = useState<CountryCode[]>([])
  const [loading, setLoading] = useState(true)

  const texts = {
    IT: {
      placeholder: "Paese",
      searchPlaceholder: "Cerca paese...",
      noResults: "Nessun paese trovato",
      loading: "Caricamento paesi..."
    },
    ENG: {
      placeholder: "Country",
      searchPlaceholder: "Search country...",
      noResults: "No country found",
      loading: "Loading countries..."
    }
  }

  const currentTexts = texts[language]

  useEffect(() => {
    loadCountries()
  }, [])

  const loadCountries = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/country-codes`)
      const data = await response.json()
      setCountries(data.country_codes || [])
    } catch (error) {
      console.error('Errore nel caricamento dei paesi:', error)
      // Fallback con lista paesi hardcoded se l'API non funziona
      setCountries([
        {"code": "+1", "country": "United States", "flag": "🇺🇸", "name": "United States"},
        {"code": "+1", "country": "Canada", "flag": "🇨🇦", "name": "Canada"},
        {"code": "+7", "country": "Russia", "flag": "🇷🇺", "name": "Russia"},
        {"code": "+20", "country": "Egypt", "flag": "🇪🇬", "name": "Egypt"},
        {"code": "+27", "country": "South Africa", "flag": "🇿🇦", "name": "South Africa"},
        {"code": "+30", "country": "Greece", "flag": "🇬🇷", "name": "Greece"},
        {"code": "+31", "country": "Netherlands", "flag": "🇳🇱", "name": "Netherlands"},
        {"code": "+32", "country": "Belgium", "flag": "🇧🇪", "name": "Belgium"},
        {"code": "+33", "country": "France", "flag": "🇫🇷", "name": "France"},
        {"code": "+34", "country": "Spain", "flag": "🇪🇸", "name": "Spain"},
        {"code": "+36", "country": "Hungary", "flag": "🇭🇺", "name": "Hungary"},
        {"code": "+39", "country": "Italy", "flag": "🇮🇹", "name": "Italy"},
        {"code": "+40", "country": "Romania", "flag": "🇷🇴", "name": "Romania"},
        {"code": "+41", "country": "Switzerland", "flag": "🇨🇭", "name": "Switzerland"},
        {"code": "+43", "country": "Austria", "flag": "🇦🇹", "name": "Austria"},
        {"code": "+44", "country": "United Kingdom", "flag": "🇬🇧", "name": "United Kingdom"},
        {"code": "+45", "country": "Denmark", "flag": "🇩🇰", "name": "Denmark"},
        {"code": "+46", "country": "Sweden", "flag": "🇸🇪", "name": "Sweden"},
        {"code": "+47", "country": "Norway", "flag": "🇳🇴", "name": "Norway"},
        {"code": "+48", "country": "Poland", "flag": "🇵🇱", "name": "Poland"},
        {"code": "+49", "country": "Germany", "flag": "🇩🇪", "name": "Germany"},
        {"code": "+51", "country": "Peru", "flag": "🇵🇪", "name": "Peru"},
        {"code": "+52", "country": "Mexico", "flag": "🇲🇽", "name": "Mexico"},
        {"code": "+53", "country": "Cuba", "flag": "🇨🇺", "name": "Cuba"},
        {"code": "+54", "country": "Argentina", "flag": "🇦🇷", "name": "Argentina"},
        {"code": "+55", "country": "Brazil", "flag": "🇧🇷", "name": "Brazil"},
        {"code": "+56", "country": "Chile", "flag": "🇨🇱", "name": "Chile"},
        {"code": "+57", "country": "Colombia", "flag": "🇨🇴", "name": "Colombia"},
        {"code": "+58", "country": "Venezuela", "flag": "🇻🇪", "name": "Venezuela"},
        {"code": "+60", "country": "Malaysia", "flag": "🇲🇾", "name": "Malaysia"},
        {"code": "+61", "country": "Australia", "flag": "🇦🇺", "name": "Australia"},
        {"code": "+62", "country": "Indonesia", "flag": "🇮🇩", "name": "Indonesia"},
        {"code": "+63", "country": "Philippines", "flag": "🇵🇭", "name": "Philippines"},
        {"code": "+64", "country": "New Zealand", "flag": "🇳🇿", "name": "New Zealand"},
        {"code": "+65", "country": "Singapore", "flag": "🇸🇬", "name": "Singapore"},
        {"code": "+66", "country": "Thailand", "flag": "🇹🇭", "name": "Thailand"},
        {"code": "+81", "country": "Japan", "flag": "🇯🇵", "name": "Japan"},
        {"code": "+82", "country": "South Korea", "flag": "🇰🇷", "name": "South Korea"},
        {"code": "+84", "country": "Vietnam", "flag": "🇻🇳", "name": "Vietnam"},
        {"code": "+86", "country": "China", "flag": "🇨🇳", "name": "China"},
        {"code": "+90", "country": "Turkey", "flag": "🇹🇷", "name": "Turkey"},
        {"code": "+91", "country": "India", "flag": "🇮🇳", "name": "India"},
        {"code": "+92", "country": "Pakistan", "flag": "🇵🇰", "name": "Pakistan"},
        {"code": "+93", "country": "Afghanistan", "flag": "🇦🇫", "name": "Afghanistan"},
        {"code": "+94", "country": "Sri Lanka", "flag": "🇱🇰", "name": "Sri Lanka"},
        {"code": "+95", "country": "Myanmar", "flag": "🇲🇲", "name": "Myanmar"},
        {"code": "+98", "country": "Iran", "flag": "🇮🇷", "name": "Iran"}
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredCountries = searchTerm.trim() === '' 
    ? countries 
    : countries.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.includes(searchTerm)
      )

  const selectedCountry = countries.find(country => country.code === value)

  const handleSelect = (country: CountryCode) => {
    onChange(country.code)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className={`relative ${className}`} style={{ minWidth: '160px' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
        }`}
        disabled={loading}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {selectedCountry ? (
              <>
                <span className="mr-2">{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.name}</span>
                <span className="ml-2 text-xs text-gray-500">({selectedCountry.code})</span>
              </>
            ) : (
              <span className="text-gray-500">{placeholder || currentTexts.placeholder}</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden" style={{ minWidth: '160px' }}>
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={currentTexts.searchPlaceholder}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                {currentTexts.loading}
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {currentTexts.noResults}
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={`${country.code}-${country.country}`}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center"
                >
                  <span className="mr-3">{country.flag}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{country.name}</div>
                    <div className="text-xs text-gray-500">{country.code}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
