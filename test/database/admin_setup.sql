-- สร้าง table สำหรับ admin
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้าง index สำหรับการค้นหา
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- สร้าง function สำหรับ update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger สำหรับ auto update timestamp
CREATE TRIGGER update_admins_updated_at 
  BEFORE UPDATE ON admins 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- เพิ่มข้อมูล admin ตัวอย่าง (password: admin123)
INSERT INTO admins (username, email, password_hash, full_name, role) 
VALUES (
  'admin', 
  'admin@shop.com',
  '$2b$10$rOz7UqWwqDzPPkKGZDOhT.mA5PqVVhOxqCeK0Y7YBmT8ZLU7bGHKe', -- admin123
  'ผู้ดูแลระบบ',
  'super_admin'
) ON CONFLICT (username) DO NOTHING;

-- สร้าง RLS policies
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับการอ่านข้อมูล admin (เฉพาะ admin ที่ล็อกอินแล้ว)
CREATE POLICY "Admins can read their own data" ON admins
  FOR SELECT USING (auth.uid()::text = id::text);

-- Policy สำหรับการอัพเดทข้อมูล
CREATE POLICY "Admins can update their own data" ON admins
  FOR UPDATE USING (auth.uid()::text = id::text);

-- สร้าง view สำหรับข้อมูล admin ที่ปลอดภัย (ไม่รวม password)
CREATE OR REPLACE VIEW admin_profiles AS
SELECT 
  id,
  username,
  email,
  full_name,
  role,
  is_active,
  last_login_at,
  created_at,
  updated_at
FROM admins
WHERE is_active = true;

-- สร้าง function สำหรับ login
CREATE OR REPLACE FUNCTION admin_login(input_username TEXT, input_password TEXT)
RETURNS TABLE(
  admin_id UUID,
  username TEXT,
  email TEXT,
  full_name TEXT,
  role TEXT,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- ค้นหา admin
  SELECT * INTO admin_record 
  FROM admins 
  WHERE (admins.username = input_username OR admins.email = input_username)
    AND is_active = true;
  
  -- ตรวจสอบว่าพบ admin หรือไม่
  IF admin_record IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::TEXT, 
      NULL::TEXT, 
      NULL::TEXT, 
      NULL::TEXT, 
      false, 
      'ไม่พบผู้ใช้หรือบัญชีถูกปิดการใช้งาน'::TEXT;
    RETURN;
  END IF;
  
  -- ตรวจสอบรหัsผ่าน (ในการใช้งานจริงควรใช้ bcrypt)
  IF admin_record.password_hash = crypt(input_password, admin_record.password_hash) THEN
    -- อัพเดท last_login_at
    UPDATE admins 
    SET last_login_at = NOW() 
    WHERE id = admin_record.id;
    
    RETURN QUERY SELECT 
      admin_record.id,
      admin_record.username,
      admin_record.email,
      admin_record.full_name,
      admin_record.role,
      true,
      'เข้าสู่ระบบสำเร็จ'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::TEXT, 
      NULL::TEXT, 
      NULL::TEXT, 
      NULL::TEXT, 
      false, 
      'รหัสผ่านไม่ถูกต้อง'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สร้าง function สำหรับเปลี่ยนรหัสผ่าน
CREATE OR REPLACE FUNCTION change_admin_password(
  admin_id UUID,
  old_password TEXT,
  new_password TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- ค้นหา admin
  SELECT * INTO admin_record 
  FROM admins 
  WHERE id = admin_id AND is_active = true;
  
  IF admin_record IS NULL THEN
    RETURN QUERY SELECT false, 'ไม่พบบัญชีผู้ใช้'::TEXT;
    RETURN;
  END IF;
  
  -- ตรวจสอบรหัสผ่านเดิม
  IF admin_record.password_hash = crypt(old_password, admin_record.password_hash) THEN
    -- อัพเดทรหัสผ่านใหม่
    UPDATE admins 
    SET password_hash = crypt(new_password, gen_salt('bf', 10))
    WHERE id = admin_id;
    
    RETURN QUERY SELECT true, 'เปลี่ยนรหัสผ่านสำเร็จ'::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'รหัสผ่านเดิมไม่ถูกต้อง'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;