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
      const response = await fetch('/api/country-codes')
      const data = await response.json()
      setCountries(data.country_codes || [])
    } catch (error) {
      console.error('Errore nel caricamento dei paesi:', error)
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
    <div className={`relative ${className}`}>
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
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
