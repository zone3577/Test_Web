'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrders } from '@/contexts/OrderContext'

interface UserInfo {
  id: string
  email: string
  name?: string
  created_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
}

export default function UserManagement() {
  const { user } = useAuth()
  const { orders } = useOrders()
  const [searchTerm, setSearchTerm] = useState('')

  // Since we don't have a proper user management system from Supabase in this context,
  // I'll create a mock user list that includes the current user and some sample data
  const mockUsers: UserInfo[] = [
    {
      id: '1',
      email: user?.email || 'user@example.com',
      name: 'ผู้ใช้ปัจจุบัน',
      created_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString()
    },
    {
      id: '2',
      email: 'john.doe@example.com',
      name: 'John Doe',
      created_at: '2024-01-15T10:30:00.000Z',
      last_sign_in_at: '2024-09-15T08:20:00.000Z',
      email_confirmed_at: '2024-01-15T11:00:00.000Z'
    },
    {
      id: '3',
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      created_at: '2024-02-20T14:15:00.000Z',
      last_sign_in_at: '2024-09-14T16:45:00.000Z',
      email_confirmed_at: '2024-02-20T14:30:00.000Z'
    }
  ]

  const filteredUsers = mockUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getUserOrdersCount = (userId: string) => {
    return orders.filter(order => order.userId === userId).length
  }

  const getUserTotalSpent = (userId: string) => {
    return orders
      .filter(order => order.userId === userId)
      .reduce((total, order) => total + order.totalAmount, 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (user: UserInfo) => {
    const isActive = user.last_sign_in_at && 
      new Date(user.last_sign_in_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        isActive
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? 'ใช้งานล่าสุด' : 'ไม่ได้ใช้งาน'}
      </span>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">จัดการผู้ใช้</h1>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="ml-4 text-sm text-gray-600">
            ผู้ใช้ทั้งหมด: {mockUsers.length} คน
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">👥</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ผู้ใช้ทั้งหมด</p>
              <p className="text-2xl font-semibold text-gray-900">{mockUsers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">✓</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ยืนยันอีเมลแล้ว</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mockUsers.filter(u => u.email_confirmed_at).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">🔄</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ใช้งานล่าสุด (7 วัน)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mockUsers.filter(u => 
                  u.last_sign_in_at && 
                  new Date(u.last_sign_in_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ใช้</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สมัครเมื่อ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เข้าใช้ล่าสุด</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คำสั่งซื้อ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดรวม</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีผู้ใช้ในระบบ'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'ไม่ระบุชื่อ'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'ไม่เคยเข้าใช้'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getUserOrdersCount(user.id)} คำสั่ง
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{getUserTotalSpent(user.id).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}