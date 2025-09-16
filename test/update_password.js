// อัพเดท password hash ใน Supabase
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

async function updatePasswordHash() {
  try {
    console.log('=== อัพเดท Password Hash ===')
    
    // Hash ใหม่ที่สร้างจาก bcrypt
    const newHash = '$2b$10$ukLSeBZ/z9u5VnFutMhGI.XpTIiyE9eBPOfNVfd.aVWJvYj00vi12'
    
    // อัพเดท password hash
    const { data, error } = await supabase
      .from('admins')
      .update({ password_hash: newHash })
      .eq('username', 'admin')
      .select()

    if (error) {
      console.error('❌ Error updating password:', error.message)
      return
    }

    console.log('✅ Password hash อัพเดทสำเร็จ')
    console.log('Updated admin:', data)

    // ทดสอบ login อีกครั้ง
    console.log('\n=== ทดสอบ Login ===')
    const { data: loginResult, error: loginError } = await supabase
      .rpc('admin_login', {
        input_username: 'admin',
        input_password: 'admin123'
      })

    if (loginError) {
      console.error('❌ Login test error:', loginError.message)
    } else {
      console.log('✅ Login test result:', loginResult)
      if (loginResult && loginResult.length > 0 && loginResult[0].success) {
        console.log('🎉 Login สำเร็จ!')
      } else {
        console.log('❌ Login ยังไม่สำเร็จ:', loginResult[0]?.message)
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

updatePasswordHash()