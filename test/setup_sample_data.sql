-- เพิ่ม sample data สำหรับทดสอบระบบ admin
-- รันโค้ดนี้ใน Supabase Dashboard → SQL Editor

-- 1. เพิ่มสินค้าตัวอย่าง (ถ้ายังไม่มี)
INSERT INTO products (name, description, price, image_url, sku, stock_quantity, category, status) VALUES
('สมาร์ทโฟน Galaxy X1', 'สมาร์ทโฟนรุ่นใหม่ล่าสุด ระบบ Android 14', 25900, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', 'PHN-001', 50, 'electronics', 'active'),
('เสื้อยืด Cotton 100%', 'เสื้อยืดผ้าคอตตอน 100% นุ่มสบาย', 590, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 'CLT-001', 100, 'clothing', 'active'),
('หนังสือ "เรียน Programming"', 'หนังสือเรียนการเขียนโปรแกรม สำหรับผู้เริ่มต้น', 450, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', 'BOK-001', 30, 'books', 'active'),
('หูฟัง Bluetooth Pro', 'หูฟัง Bluetooth รุ่นพรีเมียม เสียงใส', 3200, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 'ELC-001', 25, 'electronics', 'active'),
('กระเป๋าเป้ Travel', 'กระเป๋าเป้สำหรับเดินทาง ขนาดใหญ่', 1890, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 'ACC-001', 15, 'general', 'active')
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  stock_quantity = EXCLUDED.stock_quantity,
  category = EXCLUDED.category,
  status = EXCLUDED.status;

-- 2. เพิ่ม sample orders (ต้องมี user ก่อน)
-- หมายเหตุ: ต้องแทนที่ user_id ด้วย UUID ของ user จริงจากระบบ

-- สร้าง function สำหรับสร้าง sample orders
CREATE OR REPLACE FUNCTION create_sample_orders()
RETURNS TEXT AS $$
DECLARE
  sample_user_id UUID;
  sample_order_id UUID;
  product_record RECORD;
BEGIN
  -- หาผู้ใช้คนแรกในระบบ
  SELECT id INTO sample_user_id FROM profiles LIMIT 1;
  
  IF sample_user_id IS NULL THEN
    RETURN 'ไม่พบผู้ใช้ในระบบ กรุณาสร้างผู้ใช้ก่อน';
  END IF;
  
  -- สร้าง order ตัวอย่าง 1
  INSERT INTO orders (user_id, total_amount, status, payment_status, shipping_address, phone, notes)
  VALUES (
    sample_user_id,
    26490,
    'pending',
    'pending',
    '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
    '081-234-5678',
    'กรุณาจัดส่งในช่วงบ่าย'
  )
  RETURNING id INTO sample_order_id;
  
  -- เพิ่ม order items สำหรับ order นี้
  FOR product_record IN 
    SELECT id, price FROM products WHERE sku IN ('PHN-001', 'CLT-001') 
  LOOP
    INSERT INTO order_items (order_id, product_id, quantity, price)
    VALUES (
      sample_order_id,
      product_record.id,
      CASE WHEN product_record.price > 10000 THEN 1 ELSE 2 END,
      product_record.price
    );
  END LOOP;
  
  -- สร้าง order ตัวอย่าง 2
  INSERT INTO orders (user_id, total_amount, status, payment_status, shipping_address, phone)
  VALUES (
    sample_user_id,
    3650,
    'confirmed',
    'paid',
    '456 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',
    '082-345-6789'
  )
  RETURNING id INTO sample_order_id;
  
  -- เพิ่ม order items
  FOR product_record IN 
    SELECT id, price FROM products WHERE sku IN ('ELC-001', 'BOK-001') 
  LOOP
    INSERT INTO order_items (order_id, product_id, quantity, price)
    VALUES (
      sample_order_id,
      product_record.id,
      1,
      product_record.price
    );
  END LOOP;
  
  RETURN 'สร้าง sample orders เรียบร้อยแล้ว';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. รัน function สร้าง sample orders
SELECT create_sample_orders();

-- 4. เพิ่ม notifications ตัวอย่าง
INSERT INTO notifications (title, message, type, is_read) VALUES
('🎉 ระบบเริ่มต้นใช้งาน', 'ระบบ Admin Dashboard พร้อมใช้งานเต็มรูปแบบแล้ว!', 'success', false),
('📦 มีสินค้าใหม่', 'เพิ่มสินค้าใหม่ 5 รายการเข้าสู่ระบบแล้ว', 'info', false),
('🛒 มีคำสั่งซื้อใหม่', 'มีคำสั่งซื้อใหม่รอการดำเนินการ', 'order', false),
('⚠️ สินค้าใกล้หมด', 'กระเป๋าเป้ Travel เหลือเพียง 15 ชิ้น', 'warning', false),
('📊 รายงานยอดขาย', 'ยอดขายวันนี้: ฿30,140 (เพิ่มขึ้น 15%)', 'info', true);

-- 5. เพิ่ม user actions log
INSERT INTO user_actions (user_id, action, description) 
SELECT 
  id,
  'login',
  'ผู้ใช้เข้าสู่ระบบ'
FROM profiles 
LIMIT 3;

INSERT INTO user_actions (user_id, action, description)
SELECT 
  profiles.id,
  'place_order',
  'สั่งซื้อสินค้า รหัสออเดอร์: ' || orders.id
FROM profiles 
JOIN orders ON profiles.id = orders.user_id
LIMIT 2;

-- 6. อัพเดทสถิติ
UPDATE products SET 
  stock_quantity = stock_quantity - FLOOR(RANDOM() * 5 + 1)
WHERE status = 'active';

-- 7. ตรวจสอบผลลัพธ์
SELECT 'Database setup completed!' as status;

SELECT 
  'Products: ' || COUNT(*) as summary 
FROM products
UNION ALL
SELECT 
  'Orders: ' || COUNT(*) as summary 
FROM orders
UNION ALL
SELECT 
  'Users: ' || COUNT(*) as summary 
FROM profiles
UNION ALL
SELECT 
  'Notifications: ' || COUNT(*) as summary 
FROM notifications;

-- แสดงสถิติ dashboard
SELECT * FROM admin_dashboard_stats;