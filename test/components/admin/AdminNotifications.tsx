'use client'

import React from 'react'
import { useOrders, AdminNotification } from '@/contexts/OrderContext'

export default function AdminNotifications() {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    getUnreadNotificationsCount
  } = useOrders()

  const unreadCount = getUnreadNotificationsCount()

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNotificationIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'new_order':
        return '🛒'
      case 'user_registered':
        return '👤'
      case 'low_stock':
        return '📦'
      case 'system':
        return '⚙️'
      default:
        return '📢'
    }
  }

  const getNotificationBgColor = (type: AdminNotification['type'], isRead: boolean) => {
    if (isRead) return 'bg-gray-50'
    
    switch (type) {
      case 'new_order':
        return 'bg-blue-50 border-l-4 border-blue-400'
      case 'user_registered':
        return 'bg-green-50 border-l-4 border-green-400'
      case 'low_stock':
        return 'bg-yellow-50 border-l-4 border-yellow-400'
      case 'system':
        return 'bg-purple-50 border-l-4 border-purple-400'
      default:
        return 'bg-gray-50 border-l-4 border-gray-400'
    }
  }

  const handleNotificationClick = (notification: AdminNotification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">การแจ้งเตือน</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              อ่านทั้งหมดแล้ว
            </button>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          การแจ้งเตือนที่ยังไม่ได้อ่าน: {unreadCount} รายการ
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-gray-500 text-lg mb-2">📭</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่มีการแจ้งเตือน</h2>
            <p className="text-gray-600">ยังไม่มีการแจ้งเตือนในระบบ</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`bg-white p-4 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg ${
                getNotificationBgColor(notification.type, notification.isRead)
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${
                      notification.isRead ? 'text-gray-600' : 'text-gray-900'
                    }`}>
                      {notification.title}
                      {!notification.isRead && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ใหม่
                        </span>
                      )}
                    </h3>
                    <time className="text-xs text-gray-500">
                      {formatDate(notification.createdAt)}
                    </time>
                  </div>
                  
                  <p className={`mt-1 text-sm ${
                    notification.isRead ? 'text-gray-500' : 'text-gray-700'
                  }`}>
                    {notification.message}
                  </p>
                  
                  {notification.orderId && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        คำสั่งซื้อ #{notification.orderId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">การกระทำด่วน</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="text-2xl mb-2">🛒</div>
            <div className="font-medium text-gray-900">ตรวจสอบคำสั่งซื้อใหม่</div>
            <div className="text-sm text-gray-600">ดูคำสั่งซื้อที่รอดำเนินการ</div>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="text-2xl mb-2">📦</div>
            <div className="font-medium text-gray-900">ตรวจสอบสต็อกสินค้า</div>
            <div className="text-sm text-gray-600">ดูสินค้าที่เหลือน้อย</div>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium text-gray-900">ดูผู้ใช้ใหม่</div>
            <div className="text-sm text-gray-600">ตรวจสอบผู้ใช้ที่สมัครใหม่</div>
          </button>
        </div>
      </div>
    </div>
  )
}