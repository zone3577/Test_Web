# การแก้ไข Data Type Conflicts

## ปัญหาที่พบ
มี conflicts ระหว่าง data types ใน foreign key relationships:
- `products.id` เป็น `BIGINT` 
- `order_items.product_id` เป็น `UUID`

## วิธีแก้ไข

### ขั้นตอนที่ 1: รันไฟล์แก้ไข
```sql
-- รันไฟล์นี้ใน Supabase Dashboard → SQL Editor
admin_system_fixed.sql
```

### ขั้นตอนที่ 2: ตรวจสอบ Schema
ไฟล์จะ:
- ตรวจสอบ data types ทั้งหมด
- สร้าง tables ด้วย correct types
- เพิ่ม indexes และ constraints
- สร้าง RLS policies
- เพิ่ม functions สำหรับ admin

### ขั้นตอนที่ 3: เพิ่ม Sample Data
หลังจากรัน `admin_system_fixed.sql` แล้ว ให้รัน:

```sql
-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO products (name, description, price, image_url, stock_quantity, category) VALUES
('iPhone 15 Pro', 'สมาร์ทโฟนรุ่นใหม่ล่าสุด', 45900.00, '/api/placeholder/300/300', 50, 'electronics'),
('MacBook Air M3', 'แล็ปท็อปน้ำหนักเบา ประสิทธิภาพสูง', 42900.00, '/api/placeholder/300/300', 30, 'electronics'),
('AirPods Pro', 'หูฟังไร้สาย พร้อม Active Noise Cancellation', 8900.00, '/api/placeholder/300/300', 100, 'electronics'),
('iPad Pro', 'แท็บเล็ตสำหรับมืออาชีพ', 35900.00, '/api/placeholder/300/300', 25, 'electronics'),
('Apple Watch', 'นาฬิกาอัจฉริยะ', 12900.00, '/api/placeholder/300/300', 75, 'electronics');

-- สร้าง admin account
INSERT INTO admins (username, password_hash, email, role) VALUES
('admin', '$2b$10$K7GR8Z.KZxGxGxGxGxGxGu', 'admin@example.com', 'super_admin')
ON CONFLICT (username) DO NOTHING;
```

## ความแตกต่างสำคัญ

### เดิม (มีปัญหา)
```sql
order_items.product_id UUID REFERENCES products(id)  -- ❌ Type mismatch
```

### แก้ไขแล้ว
```sql
order_items.product_id BIGINT REFERENCES products(id) -- ✅ Correct type
```

## Features ที่เพิ่มเติม

### 1. Enhanced Admin Dashboard
- Real-time statistics
- User management (ban/suspend)
- Product CRUD operations
- Order management
- Notification system

### 2. Database Functions
- `create_order()` - สร้างออเดอร์พร้อม notifications
- `ban_user()` - แบนผู้ใช้
- `suspend_user()` - พักการใช้งาน
- `admin_dashboard_stats` view

### 3. Security Features
- Row Level Security (RLS)
- Admin-only policies
- User action logging
- Secure password hashing

## การตรวจสอบ

หลังจากรันสคริปต์แล้ว จะเห็น:
```
✅ Schema setup completed successfully!
✅ Admin dashboard stats
✅ Tables created: orders, order_items, notifications, user_actions
```

## ขั้นตอนต่อไป

1. รัน `admin_system_fixed.sql` ใน Supabase
2. เพิ่ม sample data
3. ทดสอบ admin dashboard
4. ตรวจสอบ notifications system
5. ทดสอบ user management features

## หมายเหตุ
- ไฟล์นี้จะไม่ลบข้อมูลเดิม
- ใช้ `IF NOT EXISTS` และ `ON CONFLICT DO NOTHING`
- ปลอดภัยสำหรับ production environment