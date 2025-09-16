'use client'

import React, { useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useRouter } from 'next/navigation'

export default function AdminLoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAdminAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')
      return
    }

    const result = await login(username, password)
    
    if (result.success) {
      router.push('/admin/dashboard')
    } else {
      setError(result.message || 'เข้าสู่ระบบไม่สำเร็จ')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            เข้าสู่ระบบผู้ดูแล
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            กรุณาเข้าสู่ระบบเพื่อเข้าถึงแผงควบคุมผู้ดูแล
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อผู้ใช้
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="ใส่ชื่อผู้ใช้"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่าน
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="ใส่รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <div className="text-red-400 text-xl mr-3">❌</div>
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังเข้าสู่ระบบ...
                </div>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </div>
          
          {/* ข้อมูลสำหรับทดสอบ */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 font-semibold mb-2">ข้อมูลสำหรับทดสอบ:</p>
            <p className="text-xs text-yellow-700">ชื่อผู้ใช้: <span className="font-mono">admin</span></p>
            <p className="text-xs text-yellow-700">รหัสผ่าน: <span className="font-mono">admin123</span></p>
          </div>
        </form>
      </div>
    </div>
  )
}