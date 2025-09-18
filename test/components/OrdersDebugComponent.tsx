'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Order {
  id: string
  user_id: string
  total_amount: number
  status: string
  payment_status: string
  shipping_address?: string
  phone?: string
  notes?: string
  created_at: string
  profiles?: { 
    email: string
    full_name?: string 
  }
}

export default function OrdersDebugComponent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Starting orders debug...')
      
      // ขั้นตอนที่ 1: ตรวจสอบ orders table
      const { data: ordersRaw, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('📊 Raw orders data:', ordersRaw)
      console.log('❌ Orders error:', ordersError)
      
      if (ordersError) {
        throw new Error(`Orders query failed: ${ordersError.message}`)
      }
      
      // ขั้นตอนที่ 2: ตรวจสอบ profiles table
      const { data: profilesRaw, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
      
      console.log('👥 Raw profiles data:', profilesRaw)
      console.log('❌ Profiles error:', profilesError)
      
      // ขั้นตอนที่ 3: ตรวจสอบ auth.users table
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('*')
      
      console.log('🔐 Auth users:', authUsers)
      console.log('❌ Auth error:', authError)
      
      // ขั้นตอนที่ 4: รวมข้อมูล
      if (ordersRaw && ordersRaw.length > 0) {
        const ordersWithProfiles = await Promise.all(
          ordersRaw.map(async (order) => {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', order.user_id)
                .single()
              
              if (profileError) {
                console.log(`⚠️ Profile error for user ${order.user_id}:`, profileError)
              }
              
              return {
                ...order,
                profiles: profile || { email: 'Unknown', full_name: 'Unknown User' }
              }
            } catch (err) {
              console.error(`Error loading profile for order ${order.id}:`, err)
              return {
                ...order,
                profiles: { email: 'Error loading', full_name: 'Error loading' }
              }
            }
          })
        )
        
        console.log('✅ Final orders with profiles:', ordersWithProfiles)
        setOrders(ordersWithProfiles)
      } else {
        console.log('📭 No orders found')
        setOrders([])
      }
      
      // Set debug info
      setDebugInfo({
        ordersCount: ordersRaw?.length || 0,
        profilesCount: profilesRaw?.length || 0,
        authUsersCount: authUsers?.length || 0,
        hasOrdersError: !!ordersError,
        hasProfilesError: !!profilesError,
        hasAuthError: !!authError
      })
      
    } catch (err: any) {
      console.error('💥 Orders loading error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
      
      if (error) throw error
      
      // Reload orders
      loadOrders()
      alert('อัพเดทสถานะเรียบร้อย')
    } catch (error: any) {
      console.error('Error updating order status:', error)
      alert('เกิดข้อผิดพลาดในการอัพเดทสถานะ: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">กำลังโหลดข้อมูลคำสั่งซื้อ...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">เกิดข้อผิดพลาด</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
        <button
          onClick={loadOrders}
          className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          ลองใหม่
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      {debugInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-medium mb-2">🔍 ข้อมูล Debug</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Orders:</span> {debugInfo.ordersCount}
            </div>
            <div>
              <span className="font-medium">Profiles:</span> {debugInfo.profilesCount}
            </div>
            <div>
              <span className="font-medium">Auth Users:</span> {debugInfo.authUsersCount}
            </div>
            <div>
              <span className="font-medium">Errors:</span> 
              {debugInfo.hasOrdersError || debugInfo.hasProfilesError || debugInfo.hasAuthError ? 
                ' ❌ มี Error' : ' ✅ ไม่มี Error'}
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">🛒 คำสั่งซื้อทั้งหมด</h3>
          <button
            onClick={loadOrders}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            🔄 รีเฟรช
          </button>
        </div>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">ยังไม่มีคำสั่งซื้อ</h3>
            <p className="text-gray-600 mb-4">รอลูกค้าสั่งซื้อสินค้า</p>
            <button
              onClick={loadOrders}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              ตรวจสอบใหม่
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รหัสออเดอร์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดรวม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สั่ง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.profiles?.full_name || order.profiles?.email || 'ไม่ระบุชื่อ'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.profiles?.email || 'ไม่มีอีเมล'}
                        </div>
                        <div className="text-xs text-gray-400">
                          User ID: {order.user_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{order.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' ? '🕐 รอดำเนินการ' :
                         order.status === 'confirmed' ? '✅ ยืนยันแล้ว' :
                         order.status === 'processing' ? '⚙️ กำลังเตรียม' :
                         order.status === 'shipped' ? '🚚 จัดส่งแล้ว' :
                         order.status === 'delivered' ? '📦 ส่งเสร็จแล้ว' :
                         order.status === 'cancelled' ? '❌ ยกเลิก' : order.status}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Payment: {order.payment_status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('th-TH')}
                      <div className="text-xs">
                        {new Date(order.created_at).toLocaleTimeString('th-TH')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="text-xs border-gray-300 rounded"
                      >
                        <option value="pending">รอดำเนินการ</option>
                        <option value="confirmed">ยืนยันแล้ว</option>
                        <option value="processing">กำลังเตรียม</option>
                        <option value="shipped">จัดส่งแล้ว</option>
                        <option value="delivered">ส่งเสร็จแล้ว</option>
                        <option value="cancelled">ยกเลิก</option>
                      </select>
                      
                      {/* แสดงข้อมูลการจัดส่ง */}
                      {order.shipping_address && (
                        <div className="text-xs text-gray-500 mt-1">
                          📍 {order.shipping_address.slice(0, 30)}...
                        </div>
                      )}
                      {order.phone && (
                        <div className="text-xs text-gray-500">
                          📞 {order.phone}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}