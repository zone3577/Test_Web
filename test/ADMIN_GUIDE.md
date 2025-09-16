# คู่มือการติดตั้งและใช้งานระบบ Admin 🔐

## การติดตั้งระบบ Admin

### 1. สร้าง Admin Table ใน Supabase

ไปที่ Supabase Dashboard → SQL Editor และรันคำสั่ง SQL ใน `database/admin_setup.sql`:

```sql
-- คัดลอกและรันโค้ดทั้งหมดใน database/admin_setup.sql
```

### 2. ตรวจสอบการติดตั้ง

หลังจากรัน SQL แล้ว ระบบจะสร้าง:
- ✅ Table `admins` สำหรับเก็บข้อมูล admin
- ✅ Function `admin_login()` สำหรับการเข้าสู่ระบบ
- ✅ Function `change_admin_password()` สำหรับเปลี่ยนรหัสผ่าน
- ✅ Admin account เริ่มต้น (username: admin, password: admin123)

### 3. ตรวจสอบ Tables และ Data

ตรวจสอบใน Supabase Dashboard:
- `products` table - สำหรับข้อมูลสินค้า
- `profiles` table - สำหรับข้อมูล users
- `admins` table - สำหรับข้อมูล admin

## การใช้งานระบบ Admin

### เข้าสู่ระบบ Admin

1. ไปที่ `/admin/login`
2. ใส่ข้อมูลเข้าสู่ระบบ:
   - **Username**: `admin`
   - **Password**: `admin123`
3. กดปุ่ม "เข้าสู่ระบบ"

### ฟีเจอร์ใน Admin Dashboard

#### 1. **ภาพรวม** 📊
- สถิติสินค้าทั้งหมด
- สถิติผู้ใช้
- กิจกรรมล่าสุด
- กราฟและข้อมูลสำคัญ

#### 2. **จัดการสินค้า** 📦
- ดูรายการสินค้าทั้งหมด
- ข้อมูล: ชื่อ, SKU, ราคา, สถานะ
- เรียงลำดับและกรองข้อมูล

#### 3. **จัดการผู้ใช้** 👥
- ดูรายการผู้ใช้ทั้งหมด
- ข้อมูล: email, ชื่อ, วันที่สมัคร
- ประวัติการใช้งาน

## โครงสร้างไฟล์ที่เกี่ยวข้อง

```
test/
├── database/
│   └── admin_setup.sql           # SQL สำหรับสร้าง admin system
├── app/admin/
│   ├── layout.tsx               # Layout สำหรับ admin routes
│   ├── login/
│   │   └── page.tsx            # หน้า admin login
│   └── dashboard/
│       └── page.tsx            # หน้า admin dashboard
├── components/
│   ├── AdminDashboard.tsx       # Admin dashboard component
│   └── auth/
│       └── AdminLoginForm.tsx   # Admin login form
├── contexts/
│   └── AdminAuthContext.tsx     # Admin authentication context
└── utils/
    └── authUtils.ts            # Auth utility functions
```

## การจัดการความปลอดภัย

### Admin Roles
- **admin**: ผู้ดูแลระดับปกติ
- **super_admin**: ผู้ดูแลระดับสูง (สิทธิ์เต็ม)

### Session Management
- Session หมดอายุใน 24 ชั่วโมง
- เก็บข้อมูลใน localStorage
- ตรวจสอบ session อัตโนมัติ

### การเปลี่ยนรหัสผ่าน

สำหรับการเปลี่ยนรหัสผ่าน admin สามารถใช้ function ใน database:

```sql
SELECT * FROM change_admin_password(
  'admin_id_here',
  'old_password',
  'new_password'
);
```

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

#### 1. ไม่สามารถเข้าสู่ระบบได้
- ตรวจสอบว่ารัน SQL setup แล้ว
- ตรวจสอบ username/password: `admin/admin123`
- ตรวจสอบ console เพื่อดู error

#### 2. ไม่แสดงข้อมูลสินค้า/ผู้ใช้
- ตรวจสอบว่ามี table `products` และ `profiles`
- ตรวจสอบ RLS policies ใน Supabase
- ตรวจสอบ Network tab เพื่อดู API calls

#### 3. Session หมดอายุบ่อย
- ตรวจสอบ localStorage
- ลองล็อกอินใหม่
- Clear browser cache

### การ Debug

1. เปิด Browser Developer Tools
2. ตรวจสอบ Console สำหรับ errors
3. ตรวจสอบ Network tab สำหรับ API calls
4. ตรวจสอบ Application/Storage สำหรับ localStorage

## การเพิ่ม Admin ใหม่

### ผ่าน SQL (แนะนำ)

```sql
INSERT INTO admins (username, email, password_hash, full_name, role) 
VALUES (
  'newadmin', 
  'newadmin@shop.com',
  crypt('newpassword', gen_salt('bf', 10)),
  'ชื่อ Admin ใหม่',
  'admin'
);
```

### ข้อควรระวัง
- ใช้ bcrypt สำหรับ hash password
- ตั้ง role ให้เหมาะสม
- ตรวจสอบ username/email ไม่ซ้ำ

## การอัพเกรดระบบ

### เพิ่มฟีเจอร์ใหม่
1. CRUD สำหรับสินค้า
2. การจัดการ orders
3. ระบบ notifications
4. Analytics และ reports
5. การส่งออกข้อมูล

### การปรับปรุงความปลอดภัย
1. Two-factor authentication
2. IP whitelist
3. Session timeout ที่ปรับได้
4. Audit logs
5. Role-based permissions

---

## ข้อมูลสำคัญ

**Admin เริ่มต้น**:
- Username: `admin`
- Password: `admin123`
- Role: `super_admin`

**URL สำคัญ**:
- Admin Login: `/admin/login`
- Admin Dashboard: `/admin/dashboard`

**ติดต่อสนับสนุน**: หากมีปัญหาติดต่อทีมพัฒนา