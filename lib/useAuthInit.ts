import { useEffect } from 'react'
import { useAuthStore } from './store'

/**
 * Hook per inizializzare automaticamente l'autenticazione
 * al caricamento dell'app/componente
 */
export const useAuthInit = () => {
  const { isHydrated, isAuthenticated, initializeAuth, setHydrated } = useAuthStore()

  useEffect(() => {
    // Aspetta che Zustand abbia completato l'hydration
    if (!isHydrated) {
      // Forza l'hydration se non è ancora avvenuto
      const timer = setTimeout(() => {
        setHydrated()
        initializeAuth()
      }, 100)
      
      return () => clearTimeout(timer)
    } else {
      // Se già hydrated, assicurati che l'auth sia inizializzato
      initializeAuth()
    }
  }, [isHydrated, initializeAuth, setHydrated])

  return { isHydrated, isAuthenticated }
}
