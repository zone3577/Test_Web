"use client";

import { useState } from 'react';

interface HelpTopic {
  id: string;
  title: string;
  content: string;
  category: 'getting-started' | 'shopping' | 'cart' | 'account' | 'troubleshooting';
}

const helpTopics: HelpTopic[] = [
  {
    id: '1',
    title: 'การเริ่มต้นใช้งาน',
    content: 'ยินดีต้อนรับสู่ร้านค้าออนไลน์! เริ่มต้นด้วยการเลือกสินค้าที่ต้องการ จากนั้นกดปุ่ม "เพิ่มลงตะกร้า" เพื่อเพิ่มสินค้าลงในตะกร้าของคุณ',
    category: 'getting-started'
  },
  {
    id: '2',
    title: 'การค้นหาสินค้า',
    content: 'ใช้ช่องค้นหาด้านบนเพื่อหาสินค้าจากชื่อ, รายละเอียด หรือรหัสสินค้า (SKU) คุณสามารถเรียงลำดับสินค้าตามชื่อ, ราคา หรือวันที่ได้',
    category: 'shopping'
  },
  {
    id: '3',
    title: 'การใช้งานตะกร้าสินค้า',
    content: 'คลิกไอคอนตะกร้าเพื่อดูสินค้าที่เลือก คุณสามารถเพิ่ม-ลดจำนวน หรือลบสินค้าออกได้ เมื่อพร้อมแล้วกด "สั่งซื้อสินค้า"',
    category: 'cart'
  },
  {
    id: '4',
    title: 'การปรับจำนวนสินค้า',
    content: 'ในตะกร้าสินค้า ใช้ปุ่ม + และ - เพื่อปรับจำนวนสินค้า หรือกดไอคอนถังขยะเพื่อลบสินค้าออกจากตะกร้า',
    category: 'cart'
  },
  {
    id: '5',
    title: 'การจัดการบัญชีผู้ใช้',
    content: 'คลิกที่อวตารหรือชื่อผู้ใช้ด้านขวาบนเพื่อเข้าถึงการตั้งค่าบัญชี หรือออกจากระบบ',
    category: 'account'
  },
  {
    id: '6',
    title: 'สินค้าไม่แสดงผล',
    content: 'หากสินค้าไม่แสดงผล ลองรีเฟรชหน้าเว็บ หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต หากยังมีปัญหาติดต่อฝ่ายสนับสนุน',
    category: 'troubleshooting'
  },
  {
    id: '7',
    title: 'ตะกร้าสินค้าหายไป',
    content: 'ตะกร้าสินค้าจะถูกบันทึกอัตโนมัติในเบราว์เซอร์ หากหายไปอาจเกิดจากการลบข้อมูลเบราว์เซอร์ หรือใช้โหมดไม่เก็บประวัติ',
    category: 'troubleshooting'
  }
];

export default function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'ทั้งหมด', icon: '📚' },
    { id: 'getting-started', name: 'เริ่มต้นใช้งาน', icon: '🚀' },
    { id: 'shopping', name: 'การช้อปปิ้ง', icon: '🛍️' },
    { id: 'cart', name: 'ตะกร้าสินค้า', icon: '🛒' },
    { id: 'account', name: 'บัญชีผู้ใช้', icon: '👤' },
    { id: 'troubleshooting', name: 'แก้ไขปัญหา', icon: '🔧' }
  ];

  const filteredTopics = helpTopics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-20 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
        title="ศูนย์ช่วยเหลือ"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 backdrop-blur-md bg-opacity-50 z-40"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Help Center Modal */}
      <div className="fixed inset-4 bg-white rounded-xl shadow-2xl z-50 flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎯</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">ศูนย์ช่วยเหลือ</h2>
              <p className="text-gray-600">ค้นหาคำตอบสำหรับคำถามของคุณ</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r p-6">
            <h3 className="font-semibold text-gray-800 mb-4">หมวดหมู่</h3>
            <div className="space-y-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Search */}
            <div className="p-6 border-b">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาในศูนย์ช่วยเหลือ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Help Topics */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredTopics.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    ไม่พบหัวข้อที่ค้นหา
                  </h3>
                  <p className="text-gray-500">
                    ลองใช้คำค้นหาอื่น หรือเลือกหมวดหมู่ที่ต่างออกไป
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTopics.map(topic => (
                    <div
                      key={topic.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">
                        {topic.title}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">
                        {topic.content}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {categories.find(c => c.id === topic.category)?.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-6 bg-gray-50">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-2">
                  ยังหาคำตอบไม่ได้? ติดต่อทีมสนับสนุน
                </p>
                <button
                  onClick={() => {
                    alert('ติดต่อฝ่ายสนับสนุน:\n\n📧 Email: support@shop.com\n📞 Tel: 02-xxx-xxxx\n💬 Live Chat: คลิกที่ไอคอนแชทด้านขวาล่าง\n\nเวลาให้บริการ: จันทร์-ศุกร์ 9:00-18:00 น.');
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  📞 ติดต่อเรา
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}