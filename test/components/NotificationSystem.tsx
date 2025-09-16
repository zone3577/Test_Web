'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'order'
  is_read: boolean
  created_at: string
}

interface NotificationSystemProps {
  isAdmin?: boolean
}

export default function NotificationSystem({ isAdmin = false }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
    
    if (isAdmin) {
      // สำหรับ admin - ฟังการอัพเดท notifications
      const channel = supabase
        .channel('admin-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications'
          },
          (payload) => {
            console.log('Notification change received:', payload)
            loadNotifications()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [isAdmin])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (isAdmin) {
        // Admin เห็นการแจ้งเตือนทั้งหมด
        // ไม่ต้องกรองอะไร
      } else {
        // User ทั่วไปเห็นเฉพาะการแจ้งเตือนที่เกี่ยวข้อง
        query = query.in('type', ['info', 'success'])
      }

      const { data, error } = await query

      if (error) throw error

      setNotifications(data || [])
      
      // นับการแจ้งเตือนที่ยังไม่ได้อ่าน
      const unread = (data || []).filter(n => !n.is_read).length
      setUnreadCount(unread)
      
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      // อัพเดท state ในทันที
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
      
      setUnreadCount(prev => Math.max(0, prev - 1))
      
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id)

      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds)

      if (error) throw error

      // อัพเดท state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
      
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'order': return '🛒'
      case 'info':
      default: return '📢'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'order': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'info':
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              🔔 การแจ้งเตือน
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  อ่านทั้งหมด
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">กำลังโหลด...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-500">ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id)
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-lg">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleString('th-TH')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {isAdmin && notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to notifications page
                  window.location.href = '/admin/dashboard'
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
              >
                ดูทั้งหมดใน Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click Outside to Close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}