'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'

interface Order {
  id: string
  total_amount: number
  status: string
  payment_status: string
  shipping_address?: string
  phone?: string
  created_at: string
  order_items?: Array<{
    id: string
    quantity: number
    price: number
    products: {
      name: string
      image_url: string
    }
  }>
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderForm, setOrderForm] = useState({
    shipping_address: '',
    phone: '',
    notes: ''
  })
  
  const { user } = useAuth()
  const { state: cartState, clearCart } = useCart()
  const supabase = createClient()

  const items = cartState.items
  const getTotalPrice = () => cartState.totalPrice

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            products (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || items.length === 0) {
      alert('กรุณาเข้าสู่ระบบและเพิ่มสินค้าในตะกร้าก่อน')
      return
    }

    try {
      // แปลง cart items เป็น format ที่ function ต้องการ
      const orderItems = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))

      const { data, error } = await supabase
        .rpc('create_order', {
          p_user_id: user.id,
          p_items: JSON.stringify(orderItems),
          p_shipping_address: orderForm.shipping_address || null,
          p_phone: orderForm.phone || null,
          p_notes: orderForm.notes || null
        })

      if (error) throw error

      // ล้างตะกร้า
      clearCart()
      
      // รีเซ็ตฟอร์ม
      setOrderForm({
        shipping_address: '',
        phone: '',
        notes: ''
      })
      setShowOrderForm(false)
      
      // โหลดออเดอร์ใหม่
      loadOrders()
      
      alert('สั่งซื้อสำเร็จ! รหัสออเดอร์: ' + data)
      
    } catch (error) {
      console.error('Error creating order:', error)
      alert('เกิดข้อผิดพลาดในการสั่งซื้อ')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🛒 ประวัติการสั่งซื้อ</h1>
          {items.length > 0 && (
            <button
              onClick={() => setShowOrderForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📝 สั่งซื้อตอนนี้ ({items.length} รายการ)
            </button>
          )}
        </div>

        {/* Order Form Modal */}
        {showOrderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">📝 ยืนยันการสั่งซื้อ</h3>
              
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-2">สรุปรายการสั่งซื้อ</h4>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm mb-1">
                    <span>{item.name} x{item.quantity}</span>
                    <span>฿{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 font-medium">
                  <div className="flex justify-between">
                    <span>ยอดรวม:</span>
                    <span className="text-blue-600">฿{getTotalPrice().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ที่อยู่จัดส่ง</label>
                  <textarea
                    value={orderForm.shipping_address}
                    onChange={(e) => setOrderForm({...orderForm, shipping_address: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="กรอกที่อยู่จัดส่ง..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="กรอกเบอร์โทรศัพท์..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">หมายเหตุ (ไม่บังคับ)</label>
                  <textarea
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={2}
                    placeholder="หมายเหตุเพิ่มเติม..."
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowOrderForm(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    ยืนยันการสั่งซื้อ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">ยังไม่มีประวัติการสั่งซื้อ</h3>
            <p className="text-gray-600 mb-6">เริ่มช้อปปิ้งและสั่งซื้อสินค้าเลย!</p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🛍️ เริ่มช้อปปิ้ง
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow border">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        ออเดอร์ #{order.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        สั่งเมื่อ: {new Date(order.created_at).toLocaleString('th-TH')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex space-x-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                          order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.payment_status === 'pending' ? '💳 รอชำระ' :
                           order.payment_status === 'paid' ? '✅ ชำระแล้ว' :
                           order.payment_status === 'failed' ? '❌ ชำระไม่สำเร็จ' :
                           order.payment_status === 'refunded' ? '↩️ คืนเงิน' : order.payment_status}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        ฿{order.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">รายการสินค้า:</h4>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-3">
                            {item.products?.image_url && (
                              <img
                                src={item.products.image_url}
                                alt={item.products.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.products?.name}</p>
                              <p className="text-xs text-gray-600">
                                จำนวน: {item.quantity} | ราคา: ฿{item.price.toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm font-medium">
                              ฿{(item.quantity * item.price).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shipping Info */}
                  {order.shipping_address && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">ข้อมูลการจัดส่ง:</h4>
                      <p className="text-sm text-gray-600">📍 {order.shipping_address}</p>
                      {order.phone && (
                        <p className="text-sm text-gray-600">📞 {order.phone}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}