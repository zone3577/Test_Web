// Debug script เพื่อตรวจสอบสถานะ admin ใน Supabase
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

console.log('=== Supabase Debug ===')
console.log('URL:', supabaseUrl ? 'Present' : 'Missing')
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Environment variables ไม่ครบ!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugAdmin() {
  try {
    console.log('\n=== ตรวจสอบ Tables ===')
    
    // ตรวจสอบ table admins
    console.log('1. ตรวจสอบ table admins...')
    const { data: adminTable, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .limit(1)

    if (adminError) {
      console.error('❌ Error accessing admins table:', adminError.message)
      if (adminError.message.includes('relation "public.admins" does not exist')) {
        console.log('💡 Table admins ยังไม่ได้ถูกสร้าง! ต้องรัน SQL setup ก่อน')
      }
    } else {
      console.log('✅ Table admins พบแล้ว')
      console.log('Data count:', adminTable?.length || 0)
    }

    // ตรวจสอบ admin_login function
    console.log('\n2. ตรวจสอบ admin_login function...')
    const { data: loginTest, error: loginError } = await supabase
      .rpc('admin_login', {
        input_username: 'admin',
        input_password: 'admin123'
      })

    if (loginError) {
      console.error('❌ Error calling admin_login:', loginError.message)
      if (loginError.message.includes('function admin_login')) {
        console.log('💡 Function admin_login ยังไม่ได้ถูกสร้าง! ต้องรัน SQL setup ก่อน')
      }
    } else {
      console.log('✅ Function admin_login ทำงานได้')
      console.log('Login result:', loginTest)
    }

    // ตรวจสอบข้อมูลใน table admins (ถ้ามี)
    if (!adminError) {
      console.log('\n3. ตรวจสอบข้อมูล admin...')
      const { data: admins, error: selectError } = await supabase
        .from('admins')
        .select('id, username, email, full_name, role, is_active, created_at')
        
      if (selectError) {
        console.error('❌ Error selecting admins:', selectError.message)
      } else {
        console.log('✅ ข้อมูล admin:')
        admins?.forEach(admin => {
          console.log(`  - ${admin.username} (${admin.email}) - Role: ${admin.role} - Active: ${admin.is_active}`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugAdmin()