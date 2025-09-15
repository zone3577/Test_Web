"use client";

import { useAuth } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import ProductsPage from '@/components/homeone/homeone';
import Cart from '@/components/Cart';
import CartButton from '@/components/CartButton';
import HelpCenter from '@/components/HelpCenter';
import { useNotification, NotificationContainer } from '@/components/Notification';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      // Welcome notification
      addNotification({
        type: 'success',
        title: 'ยินดีต้อนรับ!',
        message: `สวัสดี ${user.email} เข้าสู่ระบบเรียบร้อยแล้ว`,
        duration: 4000
      });
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'กำลังออกจากระบบ...',
        message: 'โปรดรอสักครู่',
        duration: 2000
      });
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      addNotification({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถออกจากระบบได้',
        duration: 5000
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo & Welcome */}
              <div className="flex items-center gap-4">
                <div className="text-3xl">🛍️</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    ร้านค้าออนไลน์
                  </h1>
                  <p className="text-sm text-gray-600">
                    สวัสดี, {userProfile?.full_name || user?.email || 'ผู้ใช้'}!
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <CartButton />
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {(userProfile?.full_name || user?.email || 'U')[0].toUpperCase()}
                  </div>
                  
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative">
          <ProductsPage />
          <Cart />
          <HelpCenter />
          <NotificationContainer />
        </main>

        {/* Quick Stats Overlay */}
        <div className="fixed bottom-6 left-6 bg-white rounded-xl shadow-lg p-4 border max-w-sm">
          <h3 className="font-semibold text-gray-800 mb-2">📊 สถิติด่วน</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ผู้ใช้:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">เข้าสู่ระบบ:</span>
              <span className="font-medium text-green-600">✓ เรียบร้อย</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">สถานะ:</span>
              <span className="font-medium text-blue-600">🔄 พร้อมใช้งาน</span>
            </div>
          </div>
        </div>

        {/* Help Button */}
        <button
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
          title="คู่มือการใช้งาน"
          onClick={() => addNotification({
            type: 'info',
            title: '💡 เคล็ดลับการใช้งาน',
            message: 'คลิกที่ปุ่มช่วยเหลือสีเขียวเพื่อดูคู่มือฉบับเต็ม!',
            duration: 6000
          })}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
      </div>
    </CartProvider>
  );
}