-- สร้าง function สำหรับ reset admin password แบบง่ายๆ
-- ปิด RLS ชั่วคราว เพื่อแก้ปัญหา

-- สร้าง function สำหรับสร้าง admin ใหม่
CREATE OR REPLACE FUNCTION reset_admin_password()
RETURNS TEXT AS $$
DECLARE
  result_message TEXT;
BEGIN
  -- ลบ admin เดิม
  DELETE FROM admins WHERE username = 'admin';
  
  -- เพิ่ม admin ใหม่
  INSERT INTO admins (username, email, password_hash, full_name, role) 
  VALUES (
    'admin', 
    'admin@shop.com',
    'admin123', -- ใช้ plain text สำหรับ debug
    'ผู้ดูแลระบบ',
    'super_admin'
  );
  
  result_message := 'Admin account reset สำเร็จ';
  RETURN result_message;
  
EXCEPTION WHEN OTHERS THEN
  RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- แก้ไข admin_login function ให้ตรวจสอบ plain text password
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
  
  -- ตรวจสอบรหัสผ่าน (plain text สำหรับ debug)
  IF admin_record.password_hash = input_password THEN
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
      format('รหัสผ่านไม่ถูกต้อง (expected: %s, got: %s)', 
             admin_record.password_hash, 
             input_password)::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;