-- สร้าง profiles table และ sync กับ auth.users
-- รันโค้ดนี้ใน Supabase Dashboard → SQL Editor

-- 1. สร้าง profiles table (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. เปิด RLS สำหรับ profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. สร้าง policy เพื่อให้ admin เข้าถึงได้
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. สร้าง function เพื่อ sync ข้อมูลจาก auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. สร้าง trigger เมื่อมี user ใหม่
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. สร้าง function เพื่อ sync users ที่มีอยู่แล้ว
CREATE OR REPLACE FUNCTION sync_existing_users()
RETURNS TEXT AS $$
DECLARE
  user_record RECORD;
  inserted_count INTEGER := 0;
BEGIN
  -- Loop through auth.users and insert into profiles
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data, created_at
    FROM auth.users
  LOOP
    INSERT INTO public.profiles (id, email, full_name, created_at)
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(
        user_record.raw_user_meta_data->>'full_name', 
        user_record.raw_user_meta_data->>'name', 
        user_record.email
      ),
      user_record.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      updated_at = NOW();
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN 'Synced ' || inserted_count || ' users to profiles table';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. รัน sync function
SELECT sync_existing_users();

-- 8. สร้าง view สำหรับ admin ดู user statistics
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_users,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as monthly_users
FROM public.profiles;

-- 9. ตรวจสอบผลลัพธ์
SELECT 'Profiles count:' as info, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'User stats:' as info, total_users FROM public.user_stats;
