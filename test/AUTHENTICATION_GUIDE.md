# คู่มือการตั้งค่าระบบ Authentication ด้วย Supabase

## ขั้นตอนการตั้งค่า Supabase

### 1. สร้างโปรเจค Supabase
1. ไปที่ [supabase.com](https://supabase.com)
2. สร้างบัญชีและเข้าสู่ระบบ
3. คลิก "New Project"
4. เลือก Organization และใส่ชื่อโปรเจค
5. ตั้งรหัสผ่าน Database
6. เลือก Region ที่ใกล้ที่สุด (สำหรับประเทศไทยแนะนำ Singapore)

### 2. ตั้งค่า Authentication
1. ในแดชบอร์ด Supabase ไปที่ **Authentication > Settings**
2. เปิดใช้งาน **Email confirmations** ถ้าต้องการให้ user ยืนยันอีเมล
3. ตั้งค่า **Site URL** เป็น `http://localhost:3001` สำหรับ development
4. เพิ่ม **Redirect URLs** สำหรับ production ภายหลัง

### 3. คัดลอกค่าคอนฟิก
1. ไปที่ **Settings > API**
2. คัดลอก:
   - **Project URL** 
   - **anon/public key**

### 4. สร้างไฟล์ .env.local
```bash
# สร้างไฟล์ .env.local ในโฟลเดอร์ test/
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## การใช้งานระบบ

### 1. สมัครสมาชิก
- ไปที่ `/signup`
- กรอกอีเมลและรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
- ยืนยันรหัสผ่าน
- คลิก "สมัครสมาชิก"

### 2. เข้าสู่ระบบ
- ไปที่ `/login`
- กรอกอีเมลและรหัสผ่าน
- คลิก "เข้าสู่ระบบ"

### 3. ออกจากระบบ
- คลิกปุ่ม "ออกจากระบบ" ใน Navigation bar

## โครงสร้างไฟล์ที่สร้างขึ้น

```
test/
├── app/
│   ├── login/page.tsx          # หน้าเข้าสู่ระบบ
│   ├── signup/page.tsx         # หน้าสมัครสมาชิก
│   ├── layout.tsx              # Layout หลักที่มี AuthProvider
│   └── page.tsx                # หน้าแรกที่แสดงสถานะ auth
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx       # ฟอร์มเข้าสู่ระบบ
│   │   └── SignUpForm.tsx      # ฟอร์มสมัครสมาชิก
│   └── Navbar.tsx              # Navigation bar ที่แสดงสถานะ auth
├── contexts/
│   └── AuthContext.tsx         # Context สำหรับจัดการ authentication
├── utils/supabase/
│   ├── client.ts               # Supabase client สำหรับ browser
│   ├── server.ts               # Supabase client สำหรับ server
│   └── middleware.ts           # Supabase client สำหรับ middleware
├── middleware.ts               # Middleware สำหรับจัดการ routing
└── .env.local.example          # ตัวอย่างไฟล์ config
```

## Features ที่มี

### ✅ ที่ใช้งานได้แล้ว
- ✅ สมัครสมาชิกด้วยอีเมล/รหัสผ่าน
- ✅ เข้าสู่ระบบ
- ✅ ออกจากระบบ
- ✅ การจัดการ session อัตโนมัติ
- ✅ Redirect หลังจาก login/logout
- ✅ UI ภาษาไทย
- ✅ Responsive design
- ✅ Error handling

### 🔧 ที่สามารถพัฒนาต่อได้
- 🔧 การยืนยันอีเมล
- 🔧 รีเซ็ตรหัสผ่าน
- 🔧 Social login (Google, Facebook, etc.)
- 🔧 Profile management
- 🔧 Protected routes
- 🔧 Role-based access control

## การทดสอบ

1. เริ่มเซิร์ฟเวอร์: `npm run dev`
2. เปิดเบราว์เซอร์ไปที่ `http://localhost:3001`
3. ทดสอบการสมัครสมาชิก
4. ทดสอบการเข้าสู่ระบบ
5. ทดสอบการออกจากระบบ

## หมายเหตุ

- ตรวจสอบให้แน่ใจว่าได้ตั้งค่า `.env.local` ถูกต้อง
- สำหรับ production ต้องอัปเดต Site URL และ Redirect URLs ใน Supabase
- ระบบนี้ใช้ Server-Side Rendering (SSR) และ Client-Side Rendering (CSR) แบบผสม