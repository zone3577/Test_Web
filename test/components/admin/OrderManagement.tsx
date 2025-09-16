'use client'

import React, { useState } from 'react'
import { useOrders, Order } from '@/contexts/OrderContext'

export default function OrderManagement() {
  const { orders, updateOrderStatus } = useOrders()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const statusOptions = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'confirmed', label: 'ยืนยันแล้ว' },
    { value: 'preparing', label: 'กำลังเตรียม' },
    { value: 'ready', label: 'พร้อมส่ง' },
    { value: 'delivered', label: 'ส่งแล้ว' },
    { value: 'cancelled', label: 'ยกเลิก' }
  ]

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    const matchesSearch = order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.includes(searchTerm)
    return matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: Order['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    const labels = {
      pending: 'รอดำเนินการ',
      confirmed: 'ยืนยันแล้ว',
      preparing: 'กำลังเตรียม',
      ready: 'พร้อมส่ง',
      delivered: 'ส่งแล้ว',
      cancelled: 'ยกเลิก'
    }

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalRevenue: orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.totalAmount, 0)
    }
    return stats
  }

  const stats = getOrderStats()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">จัดการคำสั่งซื้อ</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="ค้นหาคำสั่งซื้อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">📋</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">คำสั่งซื้อทั้งหมด</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">⏳</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">รอดำเนินการ</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">✅</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ส่งแล้ว</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.delivered}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">💰</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ยอดขายรวม</p>
              <p className="text-2xl font-semibold text-gray-900">฿{stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คำสั่งซื้อ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายการ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดรวม</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || selectedStatus !== 'all' ? 'ไม่พบคำสั่งซื้อที่ค้นหา' : 'ยังไม่มีคำสั่งซื้อในระบบ'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.userName}</div>
                      <div className="text-sm text-gray-500">{order.userEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.map((item, index) => (
                          <div key={index}>
                            {item.productName} x{item.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                        disabled={order.status === 'delivered' || order.status === 'cancelled'}
                      >
                        <option value="pending">รอดำเนินการ</option>
                        <option value="confirmed">ยืนยันแล้ว</option>
                        <option value="preparing">กำลังเตรียม</option>
                        <option value="ready">พร้อมส่ง</option>
                        <option value="delivered">ส่งแล้ว</option>
                        <option value="cancelled">ยกเลิก</option>
                      </select>
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