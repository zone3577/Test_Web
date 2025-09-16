'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface AdminUser {
  id: string
  username: string
  isAdmin: boolean
}

interface AdminContextType {
  admin: AdminUser | null
  loading: boolean
  loginAdmin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logoutAdmin: () => void
  isAuthenticated: boolean
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

// Hardcoded admin credentials (in production, use secure authentication)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if admin is already logged in (from localStorage)
    const savedAdmin = localStorage.getItem('admin_session')
    if (savedAdmin) {
      try {
        const adminData = JSON.parse(savedAdmin)
        setAdmin(adminData)
      } catch (error) {
        localStorage.removeItem('admin_session')
      }
    }
    setLoading(false)
  }, [])

  const loginAdmin = async (username: string, password: string) => {
    setLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const adminUser: AdminUser = {
        id: 'admin-1',
        username: username,
        isAdmin: true
      }
      
      setAdmin(adminUser)
      localStorage.setItem('admin_session', JSON.stringify(adminUser))
      setLoading(false)
      
      return { success: true }
    } else {
      setLoading(false)
      return { success: false, error: 'Invalid username or password' }
    }
  }

  const logoutAdmin = () => {
    setAdmin(null)
    localStorage.removeItem('admin_session')
  }

  const value = {
    admin,
    loading,
    loginAdmin,
    logoutAdmin,
    isAuthenticated: !!admin
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}