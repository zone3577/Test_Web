'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface Order {
  id: string
  userId: string
  userEmail: string
  userName: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  notes?: string
}

export interface OrderItem {
  productId: string
  productName: string
  price: number
  quantity: number
  subtotal: number
}

export interface AdminNotification {
  id: string
  type: 'new_order' | 'user_registered' | 'low_stock' | 'system'
  title: string
  message: string
  orderId?: string
  userId?: string
  productId?: string
  isRead: boolean
  createdAt: Date
}

interface OrderContextType {
  orders: Order[]
  notifications: AdminNotification[]
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateOrderStatus: (orderId: string, status: Order['status']) => void
  getUnreadNotificationsCount: () => number
  markNotificationAsRead: (notificationId: string) => void
  markAllNotificationsAsRead: () => void
  addNotification: (notification: Omit<AdminNotification, 'id' | 'createdAt' | 'isRead'>) => void
  loading: boolean
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load orders and notifications from localStorage
    const savedOrders = localStorage.getItem('admin_orders')
    const savedNotifications = localStorage.getItem('admin_notifications')
    
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders).map((o: any) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt)
        }))
        setOrders(parsedOrders)
      } catch (error) {
        console.error('Error loading orders:', error)
      }
    }

    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }))
        setNotifications(parsedNotifications)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }

    setLoading(false)
  }, [])

  const saveOrdersToStorage = (newOrders: Order[]) => {
    localStorage.setItem('admin_orders', JSON.stringify(newOrders))
  }

  const saveNotificationsToStorage = (newNotifications: AdminNotification[]) => {
    localStorage.setItem('admin_notifications', JSON.stringify(newNotifications))
  }

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const newOrders = [newOrder, ...orders]
    setOrders(newOrders)
    saveOrdersToStorage(newOrders)

    // Create notification for new order
    addNotification({
      type: 'new_order',
      title: 'คำสั่งซื้อใหม่',
      message: `มีคำสั่งซื้อใหม่จาก ${orderData.userName} (${orderData.userEmail}) มูลค่า ฿${orderData.totalAmount.toFixed(2)}`,
      orderId: newOrder.id,
      userId: orderData.userId
    })
  }

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const newOrders = orders.map(order => 
      order.id === orderId 
        ? { ...order, status, updatedAt: new Date() }
        : order
    )
    setOrders(newOrders)
    saveOrdersToStorage(newOrders)
  }

  const addNotification = (notificationData: Omit<AdminNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: AdminNotification = {
      ...notificationData,
      id: Date.now().toString(),
      isRead: false,
      createdAt: new Date()
    }
    
    const newNotifications = [newNotification, ...notifications]
    setNotifications(newNotifications)
    saveNotificationsToStorage(newNotifications)
  }

  const markNotificationAsRead = (notificationId: string) => {
    const newNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    )
    setNotifications(newNotifications)
    saveNotificationsToStorage(newNotifications)
  }

  const markAllNotificationsAsRead = () => {
    const newNotifications = notifications.map(notification => ({ 
      ...notification, 
      isRead: true 
    }))
    setNotifications(newNotifications)
    saveNotificationsToStorage(newNotifications)
  }

  const getUnreadNotificationsCount = () => {
    return notifications.filter(n => !n.isRead).length
  }

  const value = {
    orders,
    notifications,
    addOrder,
    updateOrderStatus,
    getUnreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification,
    loading
  }

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider')
  }
  return context
}