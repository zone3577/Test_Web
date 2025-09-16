'use client'

import React, { useState, useMemo } from 'react'
import { useOrders, Order } from '@/contexts/OrderContext'

export default function OrderHistory() {
  const { orders } = useOrders()
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')

  const dateFilters = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'today', label: 'วันนี้' },
    { value: 'week', label: '7 วันที่ผ่านมา' },
    { value: 'month', label: '30 วันที่ผ่านมา' },
    { value: 'year', label: 'ปีนี้' }
  ]

  const statusFilters = [
    { value: 'all', label: 'ทุกสถานะ' },
    { value: 'delivered', label: 'ส่งแล้ว' },
    { value: 'cancelled', label: 'ยกเลิก' },
    { value: 'pending', label: 'รอดำเนินการ' }
  ]

  const sortOptions = [
    { value: 'date_desc', label: 'วันที่ (ใหม่ → เก่า)' },
    { value: 'date_asc', label: 'วันที่ (เก่า → ใหม่)' },
    { value: 'amount_desc', label: 'ยอดเงิน (มาก → น้อย)' },
    { value: 'amount_asc', label: 'ยอดเงิน (น้อย → มาก)' }
  ]

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      // Date filter
      const now = new Date()
      const orderDate = order.createdAt
      let passesDateFilter = true

      switch (dateFilter) {
        case 'today':
          passesDateFilter = orderDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          passesDateFilter = orderDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          passesDateFilter = orderDate >= monthAgo
          break
        case 'year':
          passesDateFilter = orderDate.getFullYear() === now.getFullYear()
          break
      }

      // Status filter
      const passesStatusFilter = statusFilter === 'all' || order.status === statusFilter

      // Search filter
      const passesSearchFilter = 
        order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.includes(searchTerm) ||
        order.items.some(item => 
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())
        )

      return passesDateFilter && passesStatusFilter && passesSearchFilter
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'date_asc':
          return a.createdAt.getTime() - b.createdAt.getTime()
        case 'amount_desc':
          return b.totalAmount - a.totalAmount
        case 'amount_asc':
          return a.totalAmount - b.totalAmount
        default:
          return 0
      }
    })

    return filtered
  }, [orders, dateFilter, statusFilter, searchTerm, sortBy])

  const getOrderStats = useMemo(() => {
    const deliveredOrders = filteredAndSortedOrders.filter(o => o.status === 'delivered')
    const cancelledOrders = filteredAndSortedOrders.filter(o => o.status === 'cancelled')
    
    return {
      totalOrders: filteredAndSortedOrders.length,
      deliveredOrders: deliveredOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalRevenue: deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      averageOrderValue: deliveredOrders.length > 0 
        ? deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0) / deliveredOrders.length 
        : 0
    }
  }, [filteredAndSortedOrders])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">ประวัติการสั่งซื้อ</h1>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="ค้นหาคำสั่งซื้อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {dateFilters.map(filter => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {statusFilters.map(filter => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-600">คำสั่งซื้อทั้งหมด</div>
          <div className="text-2xl font-semibold text-gray-900">{getOrderStats.totalOrders}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-600">ส่งสำเร็จ</div>
          <div className="text-2xl font-semibold text-green-600">{getOrderStats.deliveredOrders}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-600">ยกเลิก</div>
          <div className="text-2xl font-semibold text-red-600">{getOrderStats.cancelledOrders}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-600">ยอดขายรวม</div>
          <div className="text-2xl font-semibold text-blue-600">฿{getOrderStats.totalRevenue.toFixed(2)}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-600">ค่าเฉลี่ย/คำสั่ง</div>
          <div className="text-2xl font-semibold text-purple-600">฿{getOrderStats.averageOrderValue.toFixed(2)}</div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายการสินค้า</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดรวม</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่สั่ง</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อัปเดตล่าสุด</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    ไม่พบข้อมูลคำสั่งซื้อตามเงื่อนไขที่กำหนด
                  </td>
                </tr>
              ) : (
                filteredAndSortedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                      {order.notes && (
                        <div className="text-xs text-gray-500 mt-1">{order.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.userName}</div>
                      <div className="text-sm text-gray-500">{order.userEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.productName}</span>
                            <span>x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        รวม {order.items.reduce((sum, item) => sum + item.quantity, 0)} รายการ
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">฿{order.totalAmount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedOrders.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          แสดง {filteredAndSortedOrders.length} รายการจากทั้งหมด {orders.length} คำสั่งซื้อ
        </div>
      )}
    </div>
  )
}