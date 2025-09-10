'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Home,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Users,
  Menu,
  X,
  Shield
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useLanguage } from '@/lib/languageContext'
import LanguageSelector from '@/components/LanguageSelector'
import HostGPTLogo from './HostGPTLogo'

interface SidebarProps {
  currentPath: string
  onLogout: () => void
  isSidebarCollapsed?: boolean
  setIsSidebarCollapsed?: (collapsed: boolean) => void
}

export default function Sidebar({ currentPath, onLogout, isSidebarCollapsed: externalIsCollapsed, setIsSidebarCollapsed: externalSetCollapsed }: SidebarProps) {
  const { user } = useAuthStore()
  const { t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false)
  
  const isSidebarCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed
  const setIsSidebarCollapsed = externalSetCollapsed || setInternalIsCollapsed

  return (
    <>
      {/* Sidebar / Drawer */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg z-40 transform transition-all duration-200 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className={`${isSidebarCollapsed ? 'p-4' : 'p-6'} relative`}>
          <button onClick={() => setIsMenuOpen(false)} className="md:hidden absolute right-3 top-3 p-2 rounded-lg hover:bg-gray-100" aria-label="Chiudi menu">
            <X className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className="hidden md:block absolute right-3 top-3 p-2 rounded-lg hover:bg-gray-100" 
            aria-label={isSidebarCollapsed ? "Espandi menu" : "Comprimi menu"}
          >
            {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
          {!isSidebarCollapsed && (
            <Link href="/" className="flex items-center space-x-2">
              <HostGPTLogo size="lg" className="text-primary" />
              <span className="text-2xl font-bold text-dark">HostGPT</span>
            </Link>
          )}
        </div>

        <nav className="mt-8">
          <Link 
            href="/dashboard" 
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3'} ${currentPath === '/dashboard' ? 'bg-primary/10 text-primary border-r-3 border-primary' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BarChart3 className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
            {!isSidebarCollapsed && t.common.dashboard}
          </Link>
          <Link 
            href="/dashboard/chatbots"
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3'} ${currentPath.startsWith('/dashboard/chatbots') ? 'bg-primary/10 text-primary border-r-3 border-primary' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <MessageSquare className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
            {!isSidebarCollapsed && t.chatbots.title}
          </Link>
          <Link 
            href="/dashboard/conversations" 
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3'} ${currentPath === '/dashboard/conversations' ? 'bg-primary/10 text-primary border-r-3 border-primary' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
            {!isSidebarCollapsed && t.conversations.title}
          </Link>
          <Link 
            href="/dashboard/guardian" 
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3'} ${currentPath === '/dashboard/guardian' ? 'bg-green-100 text-green-600 border-r-3 border-green-500' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Shield className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
            {!isSidebarCollapsed && t.guardian.title}
          </Link>
          <Link 
            href="/dashboard/settings" 
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3'} ${currentPath === '/dashboard/settings' ? 'bg-primary/10 text-primary border-r-3 border-primary' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Settings className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
            {!isSidebarCollapsed && t.common.settings}
          </Link>
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 ${isSidebarCollapsed ? 'p-2' : 'p-6'}`}>
          <div className={`bg-gray-100 rounded-lg ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {!isSidebarCollapsed && (
              <>
                <p className="text-sm font-semibold text-gray-700">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className={`text-xs mt-1 ${
                  user?.is_free_trial_active ? 'text-green-600' : 
                  user?.subscription_status === 'active' ? 'text-green-600' : 
                  user?.subscription_status === 'cancelling' ? 'text-orange-600' : 
                  'text-red-600'
                }`}>
                  {user?.is_free_trial_active ? t.dashboard.status.hostgptFreeTrial : 
                   user?.subscription_status === 'active' ? t.dashboard.status.hostgptActive : 
                   user?.subscription_status === 'cancelling' ? t.dashboard.status.hostgptCancelling : 
                   t.dashboard.status.hostgptCancelled}
                </p>
                <Link 
                  href="/dashboard/guardian"
                  className={`text-xs mt-1 cursor-pointer hover:underline transition-colors ${
                    user?.guardian_subscription_status === 'active' ? 'text-green-600' : 
                    user?.guardian_subscription_status === 'cancelling' ? 'text-orange-600' : 
                    'text-red-600'
                  }`}
                >
                  {user?.guardian_subscription_status === 'active' ? t.dashboard.status.guardianActive : 
                   user?.guardian_subscription_status === 'cancelling' ? t.dashboard.status.guardianCancelling : 
                   t.dashboard.status.guardianInactive}
                </Link>
              </>
            )}
            
            {/* Language Selector */}
            <div className="mt-4">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Topbar */}
      <div className="md:hidden sticky top-0 z-30 bg-white shadow-sm flex items-center justify-between px-4 py-3">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Apri menu">
          <Menu />
        </button>
        <Link href="/" className="flex items-center space-x-2">
          <HostGPTLogo size="md" className="text-primary" />
          <span className="text-xl font-bold text-dark">HostGPT</span>
        </Link>
        <div className="flex items-center space-x-2">
          <LanguageSelector />
          <button
            onClick={onLogout}
            className="p-2 text-gray-600 hover:text-red-600 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Drawer overlay on mobile */}
      {isMenuOpen && (
        <button
          aria-label="Chiudi menu"
          onClick={() => setIsMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-20"
        />
      )}


    </>
  )
}
