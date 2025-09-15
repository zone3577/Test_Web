'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, session, loading, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      console.log('=== handleSignOut clicked ===')
      console.log('Current user before signOut:', user)
      
      const { error } = await signOut()
      
      if (error) {
        console.error('SignOut failed:', error)
        alert('เกิดข้อผิดพลาดในการออกจากระบบ: ' + error.message)
      } else {
        console.log('SignOut successful, redirecting...')
        router.push('/')
        // Wait a bit then refresh to ensure clean state
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    } catch (err) {
      console.error('Exception in handleSignOut:', err)
      alert('เกิดข้อผิดพลาดในการออกจากระบบ')
    }
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 text-xl font-bold text-gray-800">
                My App
              </Link>
            </div>
            <div className="flex items-center">
              <div className="text-gray-500">กำลังโหลด...</div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 text-xl font-bold text-gray-800">
              My App
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  สวัสดี, {user.email}
                </span>
                <button
                  onClick={() => console.log('Current user:', user, 'Current session:', session)}
                  className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
                >
                  Debug
                </button>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}