"use client";

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if it's an auth-related error
    if (error.message?.includes('Auth session missing') || 
        error.message?.includes('Invalid Refresh Token') ||
        error.message?.includes('Refresh Token Not Found')) {
      console.log('Auth error detected, clearing localStorage');
      
      // Clear any potentially corrupted auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-auth-token');
        
        // Reload the page to reset auth state
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const resetError = () => {
        this.setState({ hasError: false, error: undefined });
      };

      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={resetError} />;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message?.includes('Auth session missing') || 
               this.state.error?.message?.includes('Invalid Refresh Token') ||
               this.state.error?.message?.includes('Refresh Token Not Found')
                ? 'เซสชันการเข้าสู่ระบบหมดอายุแล้ว กำลังรีเฟรชหน้าเว็บ...'
                : 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
              }
            </p>
            <div className="space-y-3">
              <button
                onClick={resetError}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                ลองใหม่
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                กลับหน้าหลัก
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  รายละเอียดข้อผิดพลาด (โหมดพัฒนา)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;