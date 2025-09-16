'use client'

import React, { useState } from 'react'
import { useOrders } from '@/contexts/OrderContext'
import { useProducts } from '@/contexts/ProductContext'

// This component simulates order placement for testing admin functionality
export default function OrderSimulator() {
  const { addOrder } = useOrders()
  const { products } = useProducts()
  const [isPlacing, setIsPlacing] = useState(false)

  const sampleCustomers = [
    { id: '1', name: 'สมชาย ใจดี', email: 'somchai@example.com' },
    { id: '2', name: 'สมหญิง รักงาน', email: 'somying@example.com' },
    { id: '3', name: 'ปิติ สุขใจ', email: 'piti@example.com' }
  ]

  const createSampleOrder = () => {
    if (products.length === 0) {
      alert('กรุณาเพิ่มสินค้าในระบบก่อนจำลองการสั่งซื้อ')
      return
    }

    setIsPlacing(true)

    // Random customer
    const customer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)]
    
    // Random products (1-3 items)
    const numItems = Math.floor(Math.random() * 3) + 1
    const selectedProducts = []
    
    for (let i = 0; i < numItems; i++) {
      const product = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      
      selectedProducts.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: quantity,
        subtotal: product.price * quantity
      })
    }

    const totalAmount = selectedProducts.reduce((sum, item) => sum + item.subtotal, 0)

    const newOrder = {
      userId: customer.id,
      userEmail: customer.email,
      userName: customer.name,
      items: selectedProducts,
      totalAmount: totalAmount,
      status: 'pending' as const
    }

    // Simulate async order placement
    setTimeout(() => {
      addOrder(newOrder)
      setIsPlacing(false)
      alert(`จำลองคำสั่งซื้อจาก ${customer.name} เรียบร้อยแล้ว!`)
    }, 1000)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={createSampleOrder}
        disabled={isPlacing}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
      >
        {isPlacing ? 'กำลังสร้างคำสั่งซื้อ...' : '🛒 จำลองคำสั่งซื้อ'}
      </button>
    </div>
  )
}