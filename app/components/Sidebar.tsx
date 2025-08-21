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
  X
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'

interface SidebarProps {
  currentPath: string
  onLogout: () => void
}

export default function Sidebar({ currentPath, onLogout }: SidebarProps) {
  const { user } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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
          <Link href="/" className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2'}`}>
            <Home className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-8 h-8'} text-primary`} />
            {!isSidebarCollapsed && <span className="text-2xl font-bold text-dark">HostGPT</span>}
          </Link>
        </div>

        <nav className="mt-8">
          <Link 
            href="/dashboard" 
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3'} ${currentPath === '/dashboard' ? 'bg-primary/10 text-primary border-r-3 border-primary' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BarChart3 className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
            {!isSidebarCollapsed && "Dashboard"}
          </Link>
          <Link 
            href="/dashboard/chatbots"
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3'} ${currentPath.startsWith('/dashboard/chatbots') ? 'bg-primary/10 text-primary border-r-3 border-primary' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <MessageSquare className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
            {!isSidebarCollapsed && "I Miei Chatbot"}
          </Link>
          <Link 
            href="/dashboard/conversations" 
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3'} ${currentPath === '/dashboard/conversations' ? 'bg-primary/10 text-primary border-r-3 border-primary' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
            {!isSidebarCollapsed && "Conversazioni"}
          </Link>
          <Link 
            href="/dashboard/settings" 
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-6 py-3'} ${currentPath === '/dashboard/settings' ? 'bg-primary/10 text-primary border-r-3 border-primary' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Settings className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
            {!isSidebarCollapsed && "Impostazioni"}
          </Link>
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 ${isSidebarCollapsed ? 'p-2' : 'p-6'}`}>
          <div className={`bg-gray-100 rounded-lg ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {!isSidebarCollapsed && (
              <>
                <p className="text-sm font-semibold text-gray-700">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-xs text-green-600 mt-1">
                  Abbonamento Attivo
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Topbar */}
      <div className="md:hidden sticky top-0 z-30 bg-white shadow-sm flex items-center justify-between px-4 py-3">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Apri menu">
          <Menu />
        </button>
        <Link href="/" className="flex items-center space-x-2">
          <Home className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold text-dark">HostGPT</span>
        </Link>
        <button
          onClick={onLogout}
          className="p-2 text-gray-600 hover:text-red-600 transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
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
