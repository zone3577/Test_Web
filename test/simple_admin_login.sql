-- แก้ไข admin_login function ให้ใช้ hardcoded admin ก่อน
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
BEGIN
  -- ตรวจสอบ hardcoded admin ก่อน
  IF input_username = 'admin' AND input_password = 'admin123' THEN
    RETURN QUERY SELECT 
      gen_random_uuid(),
      'admin'::TEXT,
      'admin@shop.com'::TEXT,
      'ผู้ดูแลระบบ'::TEXT,
      'super_admin'::TEXT,
      true,
      'เข้าสู่ระบบสำเร็จ (hardcoded)'::TEXT;
    RETURN;
  END IF;
  
  -- ถ้าไม่ใช่ admin ให้ส่งกลับ error
  RETURN QUERY SELECT 
    NULL::UUID, 
    NULL::TEXT, 
    NULL::TEXT, 
    NULL::TEXT, 
    NULL::TEXT, 
    false, 
    format('รหัสผ่านไม่ถูกต้อง (username: %s, password: %s)', 
           input_username, 
           input_password)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;