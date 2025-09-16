-- แก้ไข data type conflicts ในระบบ
-- รันโค้ดนี้ใน Supabase Dashboard → SQL Editor ก่อน admin_system_setup.sql

-- 1. ตรวจสอบ data type ของ products table
DO $$
BEGIN
  -- แสดงข้อมูล column types
  RAISE NOTICE 'Checking products table structure...';
END $$;

-- แสดงโครงสร้าง products table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. สร้าง orders table (ใช้ BIGINT สำหรับ user_id)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  shipping_address TEXT,
  phone VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. สร้าง order_items table ด้วย product_id ที่ match กับ products table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. สร้าง notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'order')),
  is_read BOOLEAN DEFAULT false,
  admin_id UUID,
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. สร้าง user_actions table
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. อัพเดท products table ให้มี fields เพิ่มเติม
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- เพิ่ม constraint สำหรับ status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'products_status_check'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_status_check 
    CHECK (status IN ('active', 'inactive', 'out_of_stock'));
  END IF;
END $$;

-- 7. อัพเดท profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- 8. สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);

-- 9. เปิด RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- 10. สร้าง RLS policies
-- Orders policies
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
CREATE POLICY "Admins can read all orders" ON orders
  FOR ALL USING (true);

-- Order items policies  
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
CREATE POLICY "Users can read own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can read all order items" ON order_items;
CREATE POLICY "Admins can read all order items" ON order_items
  FOR ALL USING (true);

-- Notifications policies
DROP POLICY IF EXISTS "Admins can read all notifications" ON notifications;
CREATE POLICY "Admins can read all notifications" ON notifications
  FOR ALL USING (true);

-- User actions policies
DROP POLICY IF EXISTS "Users can read own actions" ON user_actions;
CREATE POLICY "Users can read own actions" ON user_actions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all actions" ON user_actions;
CREATE POLICY "Admins can read all actions" ON user_actions
  FOR ALL USING (true);

-- 11. สร้าง function สำหรับ order management
CREATE OR REPLACE FUNCTION create_order(
  p_user_id UUID,
  p_items JSONB,
  p_shipping_address TEXT DEFAULT NULL,
  p_phone VARCHAR(20) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  order_id UUID;
  item JSONB;
  total_amount DECIMAL(10,2) := 0;
BEGIN
  -- สร้าง order ใหม่
  INSERT INTO orders (user_id, total_amount, shipping_address, phone, notes)
  VALUES (p_user_id, 0, p_shipping_address, p_phone, p_notes)
  RETURNING id INTO order_id;
  
  -- เพิ่ม order items
  FOR item IN SELECT * FROM jsonb_array_elements(p_items::JSONB)
  LOOP
    INSERT INTO order_items (order_id, product_id, quantity, price)
    VALUES (
      order_id,
      (item->>'product_id')::BIGINT,
      (item->>'quantity')::INTEGER,
      (item->>'price')::DECIMAL
    );
    
    total_amount := total_amount + ((item->>'quantity')::INTEGER * (item->>'price')::DECIMAL);
  END LOOP;
  
  -- อัพเดท total amount
  UPDATE orders SET total_amount = total_amount WHERE id = order_id;
  
  -- สร้าง notification สำหรับ admin
  INSERT INTO notifications (title, message, type, related_order_id)
  VALUES (
    'มีออเดอร์ใหม่',
    'มีการสั่งซื้อสินค้าใหม่ รหัสออเดอร์: ' || order_id::TEXT,
    'order',
    order_id
  );
  
  RETURN order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. สร้าง functions สำหรับ user management
CREATE OR REPLACE FUNCTION ban_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_banned = true,
    ban_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- บันทึก action
  INSERT INTO user_actions (user_id, action, description)
  VALUES (p_user_id, 'banned', 'User banned: ' || COALESCE(p_reason, 'No reason provided'));
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION suspend_user(
  p_user_id UUID,
  p_duration_days INTEGER DEFAULT 7,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_suspended = true,
    suspended_until = NOW() + (p_duration_days || ' days')::INTERVAL,
    ban_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- บันทึก action
  INSERT INTO user_actions (user_id, action, description)
  VALUES (p_user_id, 'suspended', 'User suspended for ' || p_duration_days || ' days: ' || COALESCE(p_reason, 'No reason provided'));
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. สร้าง view สำหรับ admin dashboard
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE is_banned = true) as banned_users,
  (SELECT COUNT(*) FROM profiles WHERE is_suspended = true AND suspended_until > NOW()) as suspended_users,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM products WHERE status = 'active') as active_products,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
  (SELECT COUNT(*) FROM notifications WHERE is_read = false) as unread_notifications,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status IN ('confirmed', 'processing', 'shipped', 'delivered')) as total_revenue;

-- 14. เพิ่ม sample notifications
INSERT INTO notifications (title, message, type, is_read) VALUES
('ยินดีต้อนรับ', 'ระบบ admin dashboard พร้อมใช้งานแล้ว', 'success', false),
('อัพเดทระบบ', 'เพิ่มฟีเจอร์การจัดการสินค้าและผู้ใช้', 'info', false)
ON CONFLICT DO NOTHING;

-- 15. ตรวจสอบผลลัพธ์
SELECT 'Schema setup completed successfully!' as status;

-- แสดงสถิติ
SELECT * FROM admin_dashboard_stats;

-- แสดงจำนวน tables ที่สร้างแล้ว
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'order_items', 'notifications', 'user_actions')
ORDER BY tablename;