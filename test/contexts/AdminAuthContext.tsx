"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Admin {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'super_admin';
  last_login_at?: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // ตรวจสอบ admin session จาก localStorage
    const checkAdminSession = () => {
      try {
        const savedAdmin = localStorage.getItem('admin_session');
        if (savedAdmin) {
          const adminData = JSON.parse(savedAdmin);
          // ตรวจสอบว่า session ยังไม่หมดอายุ (24 ชั่วโมง)
          const sessionTime = new Date(adminData.loginTime);
          const currentTime = new Date();
          const timeDiff = currentTime.getTime() - sessionTime.getTime();
          const hoursDiff = timeDiff / (1000 * 3600);
          
          if (hoursDiff < 24) {
            setAdmin(adminData.admin);
          } else {
            localStorage.removeItem('admin_session');
          }
        }
      } catch (error) {
        console.error('Error checking admin session:', error);
        localStorage.removeItem('admin_session');
      } finally {
        setLoading(false);
      }
    };

    checkAdminSession();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      
      // เรียก function admin_login ใน Supabase
      const { data, error } = await supabase.rpc('admin_login', {
        input_username: username,
        input_password: password
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
      }

      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.success) {
          const adminData: Admin = {
            id: result.admin_id,
            username: result.username,
            email: result.email,
            full_name: result.full_name,
            role: result.role
          };
          
          setAdmin(adminData);
          
          // บันทึก session ใน localStorage
          localStorage.setItem('admin_session', JSON.stringify({
            admin: adminData,
            loginTime: new Date().toISOString()
          }));
          
          return { success: true, message: result.message };
        } else {
          return { success: false, message: result.message };
        }
      }
      
      return { success: false, message: 'ไม่สามารถเข้าสู่ระบบได้' };
    } catch (error) {
      console.error('Login exception:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin_session');
  };

  const isAuthenticated = admin !== null;

  const value: AdminAuthContextType = {
    admin,
    loading,
    login,
    logout,
    isAuthenticated
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// Higher-order component สำหรับ protect admin routes
export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AdminProtectedComponent(props: P) {
    const { admin, loading } = useAdminAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!admin) {
      // redirect to admin login
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}