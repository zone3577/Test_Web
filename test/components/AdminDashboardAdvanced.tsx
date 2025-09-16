'use client'

import React, { useState, useEffect } from 'react'
import { useAdminAuth, withAdminAuth } from '@/contexts/AdminAuthContext'
import { createClient } from '@/utils/supabase/client'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  sku: string
  stock_quantity: number
  category: string
  status: 'active' | 'inactive' | 'out_of_stock'
  created_at: string
}

interface User {
  id: string
  email: string
  full_name: string
  is_banned: boolean
  is_suspended: boolean
  ban_reason?: string
  suspended_until?: string
  login_count: number
  last_login_at?: string
  created_at: string
}

interface Order {
  id: string
  user_id: string
  total_amount: number
  status: string
  payment_status: string
  shipping_address?: string
  phone?: string
  created_at: string
  profiles?: { email: string; full_name: string }
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

interface DashboardStats {
  total_users: number
  banned_users: number
  suspended_users: number
  total_products: number
  active_products: number
  total_orders: number
  pending_orders: number
  unread_notifications: number
  total_revenue: number
}

function AdminDashboard() {
  const { admin, logout } = useAdminAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const supabase = createClient()

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    sku: '',
    stock_quantity: 0,
    category: 'general',
    status: 'active'
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // โหลดสถิติ
      const { data: statsData } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single()
      
      if (statsData) setStats(statsData)

      // โหลดข้อมูลตามแท็บที่เลือก
      if (activeTab === 'products' || activeTab === 'overview') {
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (productsData) setProducts(productsData)
      }

      if (activeTab === 'users' || activeTab === 'overview') {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (usersData) setUsers(usersData)
      }

      if (activeTab === 'orders' || activeTab === 'overview') {
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            *,
            profiles!orders_user_id_fkey(email, full_name)
          `)
          .order('created_at', { ascending: false })
        
        if (ordersData) setOrders(ordersData)
      }

      if (activeTab === 'notifications' || activeTab === 'overview') {
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (notificationsData) setNotifications(notificationsData)
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProduct) {
        // แก้ไขสินค้า
        const { error } = await supabase
          .from('products')
          .update(productForm)
          .eq('id', editingProduct.id)
        
        if (error) throw error
      } else {
        // เพิ่มสินค้าใหม่
        const { error } = await supabase
          .from('products')
          .insert([productForm])
        
        if (error) throw error
      }
      
      // รีเซ็ตฟอร์ม
      setProductForm({
        name: '',
        description: '',
        price: 0,
        image_url: '',
        sku: '',
        stock_quantity: 0,
        category: 'general',
        status: 'active'
      })
      setEditingProduct(null)
      setShowProductForm(false)
      
      // โหลดข้อมูลใหม่
      loadDashboardData()
      
    } catch (error) {
      console.error('Error saving product:', error)
      alert('เกิดข้อผิดพลาดในการบันทึกสินค้า')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) return
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
      
      if (error) throw error
      
      loadDashboardData()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('เกิดข้อผิดพลาดในการลบสินค้า')
    }
  }

  const handleBanUser = async (userId: string, reason: string = '') => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะแบนผู้ใช้นี้?')) return
    
    try {
      const { error } = await supabase
        .rpc('ban_user', {
          p_user_id: userId,
          p_reason: reason || null
        })
      
      if (error) throw error
      
      loadDashboardData()
      alert('แบนผู้ใช้เรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error banning user:', error)
      alert('เกิดข้อผิดพลาดในการแบนผู้ใช้')
    }
  }

  const handleSuspendUser = async (userId: string, days: number = 7, reason: string = '') => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะระงับผู้ใช้นี้เป็นเวลา ${days} วัน?`)) return
    
    try {
      const { error } = await supabase
        .rpc('suspend_user', {
          p_user_id: userId,
          p_duration_days: days,
          p_reason: reason || null
        })
      
      if (error) throw error
      
      loadDashboardData()
      alert(`ระงับผู้ใช้เป็นเวลา ${days} วันเรียบร้อยแล้ว`)
    } catch (error) {
      console.error('Error suspending user:', error)
      alert('เกิดข้อผิดพลาดในการระงับผู้ใช้')
    }
  }

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
      
      if (error) throw error
      
      loadDashboardData()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🛠️ Admin Dashboard</h1>
              <p className="text-sm text-gray-600">จัดการระบบและข้อมูลทั้งหมด</p>
            </div>
            <div className="flex items-center space-x-4">
              {stats && (
                <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full">
                  <span className="text-red-600 text-sm">🔔</span>
                  <span className="text-red-700 text-sm font-medium">
                    {stats.unread_notifications} การแจ้งเตือน
                  </span>
                </div>
              )}
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', name: '📊 ภาพรวม', icon: '📊' },
              { id: 'products', name: '📦 จัดการสินค้า', icon: '📦' },
              { id: 'users', name: '👥 จัดการผู้ใช้', icon: '👥' },
              { id: 'orders', name: '🛒 คำสั่งซื้อ', icon: '🛒' },
              { id: 'notifications', name: '🔔 การแจ้งเตือน', icon: '🔔' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  loadDashboardData()
                }}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-3xl">👥</div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">ผู้ใช้ทั้งหมด</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-3xl">📦</div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">สินค้าทั้งหมด</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_products}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-3xl">🛒</div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">คำสั่งซื้อรอดำเนินการ</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pending_orders}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-3xl">💰</div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">ยอดขายรวม</p>
                    <p className="text-2xl font-bold text-green-600">฿{stats.total_revenue?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium">🛒 คำสั่งซื้อล่าสุด</h3>
                </div>
                <div className="p-6">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{order.profiles?.full_name || order.profiles?.email}</p>
                        <p className="text-sm text-gray-600">฿{order.total_amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-gray-500 text-center py-4">ยังไม่มีคำสั่งซื้อ</p>
                  )}
                </div>
              </div>

              {/* Recent Notifications */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium">🔔 การแจ้งเตือนล่าสุด</h3>
                </div>
                <div className="p-6">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="py-3 border-b last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkNotificationRead(notification.id)}
                            className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-gray-500 text-center py-4">ไม่มีการแจ้งเตือน</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">📦 จัดการสินค้า</h2>
              <button
                onClick={() => {
                  setEditingProduct(null)
                  setProductForm({
                    name: '',
                    description: '',
                    price: 0,
                    image_url: '',
                    sku: '',
                    stock_quantity: 0,
                    category: 'general',
                    status: 'active'
                  })
                  setShowProductForm(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ➕ เพิ่มสินค้าใหม่
              </button>
            </div>

            {/* Product Form Modal */}
            {showProductForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-medium mb-4">
                    {editingProduct ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}
                  </h3>
                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ชื่อสินค้า</label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">รายละเอียด</label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ราคา</label>
                        <input
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">จำนวนคงคลัง</label>
                        <input
                          type="number"
                          value={productForm.stock_quantity}
                          onChange={(e) => setProductForm({...productForm, stock_quantity: Number(e.target.value)})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SKU</label>
                      <input
                        type="text"
                        value={productForm.sku}
                        onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL รูปภาพ</label>
                      <input
                        type="url"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
                        <select
                          value={productForm.category}
                          onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="general">ทั่วไป</option>
                          <option value="electronics">อิเล็กทรอนิกส์</option>
                          <option value="clothing">เสื้อผ้า</option>
                          <option value="food">อาหาร</option>
                          <option value="books">หนังสือ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                        <select
                          value={productForm.status}
                          onChange={(e) => setProductForm({...productForm, status: e.target.value as any})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="active">เปิดขาย</option>
                          <option value="inactive">ปิดขาย</option>
                          <option value="out_of_stock">สินค้าหมด</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowProductForm(false)}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {editingProduct ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow border">
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'active' ? 'bg-green-100 text-green-800' :
                        product.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'active' ? 'เปิดขาย' :
                         product.status === 'inactive' ? 'ปิดขาย' : 'สินค้าหมด'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-blue-600">฿{product.price.toLocaleString()}</span>
                      <span className="text-sm text-gray-500">คงคลัง: {product.stock_quantity}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product)
                          setProductForm({
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            image_url: product.image_url,
                            sku: product.sku,
                            stock_quantity: product.stock_quantity,
                            category: product.category,
                            status: product.status
                          })
                          setShowProductForm(true)
                        }}
                        className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      >
                        ✏️ แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        🗑️ ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">ยังไม่มีสินค้าในระบบ</p>
                <p className="text-gray-400">คลิกปุ่ม "เพิ่มสินค้าใหม่" เพื่อเริ่มต้น</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">👥 จัดการผู้ใช้</h2>
            
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium">รายชื่อผู้ใช้ทั้งหมด</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ผู้ใช้
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        เข้าสู่ระบบ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่สมัคร
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || user.email}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {user.is_banned && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                🚫 ถูกแบน
                              </span>
                            )}
                            {user.is_suspended && (
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                ⏸️ ถูกระงับ
                              </span>
                            )}
                            {!user.is_banned && !user.is_suspended && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                ✅ ปกติ
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div>ครั้งที่: {user.login_count || 0}</div>
                            {user.last_login_at && (
                              <div>ล่าสุด: {new Date(user.last_login_at).toLocaleDateString('th-TH')}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {!user.is_banned && !user.is_suspended && (
                            <>
                              <button
                                onClick={() => {
                                  const reason = prompt('เหตุผลในการระงับ (ไม่บังคับ):')
                                  const days = prompt('จำนวนวันที่ต้องการระงับ:', '7')
                                  if (days) {
                                    handleSuspendUser(user.id, parseInt(days), reason || '')
                                  }
                                }}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                ⏸️ ระงับ
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('เหตุผลในการแบน (ไม่บังคับ):')
                                  handleBanUser(user.id, reason || '')
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                🚫 แบน
                              </button>
                            </>
                          )}
                          {user.ban_reason && (
                            <div className="text-xs text-gray-500 mt-1">
                              เหตุผล: {user.ban_reason}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {users.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">ยังไม่มีผู้ใช้ในระบบ</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">🛒 จัดการคำสั่งซื้อ</h2>
            
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium">คำสั่งซื้อทั้งหมด</h3>
              </div>
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
                              {order.profiles?.full_name || 'ไม่ระบุชื่อ'}
                            </div>
                            <div className="text-sm text-gray-500">{order.profiles?.email}</div>
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
                            {order.status === 'pending' ? 'รอดำเนินการ' :
                             order.status === 'confirmed' ? 'ยืนยันแล้ว' :
                             order.status === 'processing' ? 'กำลังเตรียม' :
                             order.status === 'shipped' ? 'จัดส่งแล้ว' :
                             order.status === 'delivered' ? 'ส่งเสร็จแล้ว' :
                             order.status === 'cancelled' ? 'ยกเลิก' : order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={order.status}
                            onChange={async (e) => {
                              try {
                                const { error } = await supabase
                                  .from('orders')
                                  .update({ status: e.target.value })
                                  .eq('id', order.id)
                                
                                if (error) throw error
                                loadDashboardData()
                              } catch (error) {
                                console.error('Error updating order status:', error)
                                alert('เกิดข้อผิดพลาดในการอัพเดทสถานะ')
                              }
                            }}
                            className="text-xs border-gray-300 rounded"
                          >
                            <option value="pending">รอดำเนินการ</option>
                            <option value="confirmed">ยืนยันแล้ว</option>
                            <option value="processing">กำลังเตรียม</option>
                            <option value="shipped">จัดส่งแล้ว</option>
                            <option value="delivered">ส่งเสร็จแล้ว</option>
                            <option value="cancelled">ยกเลิก</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">ยังไม่มีคำสั่งซื้อ</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">🔔 การแจ้งเตือน</h2>
            
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium">การแจ้งเตือนทั้งหมด</h3>
              </div>
              <div className="p-6 space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg ${
                            notification.type === 'success' ? '✅' :
                            notification.type === 'warning' ? '⚠️' :
                            notification.type === 'error' ? '❌' :
                            notification.type === 'order' ? '🛒' : '📢'
                          }`}>
                            {notification.type === 'success' ? '✅' :
                             notification.type === 'warning' ? '⚠️' :
                             notification.type === 'error' ? '❌' :
                             notification.type === 'order' ? '🛒' : '📢'}
                          </span>
                          <h4 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleString('th-TH')}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkNotificationRead(notification.id)}
                          className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          ทำเครื่องหมายว่าอ่านแล้ว
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {notifications.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">ไม่มีการแจ้งเตือน</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default withAdminAuth(AdminDashboard)