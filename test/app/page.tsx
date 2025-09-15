'use client'

import { useAuth } from "@/contexts/AuthContext";
import Homeone from "@/components/homeone/homeone";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div>
      {user ? (
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-800 mb-4">ยินดีต้อนรับ!</h2>
            <p className="text-green-700">
              คุณได้เข้าสู่ระบบสำเร็จแล้วด้วยอีเมล: <strong>{user.email}</strong>
            </p>
            <p className="text-green-600 text-sm mt-2">
              User ID: {user.id}
            </p>
          </div>
          <Homeone />
        </div>
      ) : (
        <div >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-center">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">ยินดีต้อนรับสู่เว็บไซต์</h2>
            <p className="text-blue-700 mb-4">
              กรุณาเข้าสู่ระบบหรือสมัครสมาชิกเพื่อเริ่มใช้งาน
            </p>
            <div className="space-x-4">
              <a 
                href="/login" 
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                เข้าสู่ระบบ
              </a>
              <a 
                href="/signup" 
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition duration-200"
              >
                สมัครสมาชิก
              </a>
            </div>
          </div>
          <Homeone />
        </div>
      )}
    </div>
  );
}
