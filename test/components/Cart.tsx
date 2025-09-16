"use client";

import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

export default function Cart() {
  const { state, removeFromCart, updateQuantity, clearCart, toggleCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: currency || 'THB',
    }).format(price);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    updateQuantity(productId, newQuantity);
  };

  const handleCheckout = async () => {
    if (state.items.length === 0) {
      alert('ตะกร้าสินค้าว่างเปล่า')
      return
    }
    
    // นำผู้ใช้ไปหน้า orders เพื่อทำการสั่งซื้อ
    toggleCart()
    window.location.href = '/orders'
  };

  if (!state.isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0  bg-opacity-50 z-40"
        onClick={toggleCart}
      />
      
      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            🛒 ตะกร้าสินค้า
          </h2>
          <button
            onClick={toggleCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {state.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                ตะกร้าสินค้าว่างเปล่า
              </h3>
              <p className="text-gray-500 text-sm">
                เพิ่มสินค้าลงในตะกร้าเพื่อเริ่มต้นช้อปปิ้ง
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start gap-3">
                    {/* Product Image Placeholder */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <div className="text-white text-xl">📦</div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        SKU: {item.sku}
                      </p>
                      <p className="text-sm font-medium text-blue-600">
                        {formatPrice(item.price, item.currency)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      title="ลบออกจากตะกร้า"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <span className="w-12 text-center font-semibold">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">รวม</p>
                      <p className="font-semibold text-gray-800">
                        {formatPrice(item.price * item.quantity, item.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t p-6 bg-gray-50">
            {/* Summary */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">จำนวนสินค้า:</span>
                <span className="font-medium">{state.totalItems} ชิ้น</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>ยอดรวมทั้งหมด:</span>
                <span className="text-blue-600">
                  {formatPrice(state.totalPrice, 'THB')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  isCheckingOut
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isCheckingOut ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>กำลังดำเนินการ...</span>
                  </div>
                ) : (
                  '💳 สั่งซื้อสินค้า'
                )}
              </button>
              
              <button
                onClick={clearCart}
                className="w-full py-2 px-4 rounded-lg font-medium text-red-600 border border-red-300 hover:bg-red-50 transition-colors"
              >
                🗑️ ลบสินค้าทั้งหมด
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}