// ตรวจสอบข้อมูล users ใน Supabase
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// อ่าน .env.local
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envLines = envContent.split('\n')

let supabaseUrl = ''
let supabaseAnonKey = ''

envLines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.replace('NEXT_PUBLIC_SUPABASE_URL=', '').trim()
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.replace('NEXT_PUBLIC_SUPABASE_ANON_KEY=', '').trim()
  }
})

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUsers() {
  try {
    console.log('=== ตรวจสอบข้อมูล Users ===')
    
    // 1. ตรวจสอบ auth.users (ไม่สามารถเข้าถึงโดยตรงได้)
    console.log('1. ตรวจสอบ auth.users...')
    console.log('❌ ไม่สามารถเข้าถึง auth.users โดยตรงได้ (security)')
    
    // 2. ตรวจสอบ profiles table
    console.log('\n2. ตรวจสอบ profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      
    if (profilesError) {
      console.error('❌ Error accessing profiles:', profilesError.message)
      if (profilesError.message.includes('relation "public.profiles" does not exist')) {
        console.log('💡 Table profiles ยังไม่ได้ถูกสร้าง!')
      }
    } else {
      console.log('✅ Table profiles พบแล้ว')
      console.log('จำนวนข้อมูลใน profiles:', profiles?.length || 0)
      console.log('ข้อมูล profiles:', profiles)
    }

    // 3. ตรวจสอบ user_stats view
    console.log('\n3. ตรวจสอบ user_stats view...')
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      
    if (statsError) {
      console.error('❌ Error accessing user_stats:', statsError.message)
      if (statsError.message.includes('relation "public.user_stats" does not exist')) {
        console.log('💡 View user_stats ยังไม่ได้ถูกสร้าง!')
      }
    } else {
      console.log('✅ View user_stats พบแล้ว')
      console.log('สถิติ users:', userStats)
    }

    // 4. ตรวจสอบ products table
    console.log('\n4. ตรวจสอบ products table...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      
    if (productsError) {
      console.error('❌ Error accessing products:', productsError.message)
      if (productsError.message.includes('relation "public.products" does not exist')) {
        console.log('💡 Table products ยังไม่ได้ถูกสร้าง!')
      }
    } else {
      console.log('✅ Table products พบแล้ว')
      console.log('จำนวนสินค้า:', products?.length || 0)
    }

    console.log('\n=== สรุป ===')
    console.log('- Authentication Users: มีอยู่ 1 ผู้ใช้ (ตามที่คุณบอก)')
    console.log('- Profiles Table:', profiles ? `${profiles.length} รายการ` : 'ไม่มี/ไม่สามารถเข้าถึงได้')
    console.log('- Products Table:', products ? `${products.length} รายการ` : 'ไม่มี/ไม่สามารถเข้าถึงได้')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkUsers()
