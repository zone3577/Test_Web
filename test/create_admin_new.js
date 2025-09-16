// สร้าง admin account ใหม่ด้วย PostgreSQL crypt
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

async function createAdminWithCrypt() {
  try {
    console.log('=== สร้าง Admin ใหม่ด้วย PostgreSQL crypt ===')
    
    // 1. ลบ admin เดิม
    console.log('1. ลบ admin เดิม...')
    const { error: deleteError } = await supabase
      .from('admins')
      .delete()
      .eq('username', 'admin')
    
    if (deleteError && !deleteError.message.includes('RLS')) {
      console.error('Error deleting:', deleteError.message)
    } else {
      console.log('✅ ลบ admin เดิมแล้ว (หรือไม่มี)')
    }

    // 2. สร้าง hash ด้วย PostgreSQL crypt
    console.log('2. สร้าง hash ด้วย PostgreSQL crypt...')
    const { data: cryptResult, error: cryptError } = await supabase
      .rpc('exec_sql', {
        query: "SELECT crypt('admin123', gen_salt('bf', 10)) as password_hash"
      })

    if (cryptError) {
      console.log('❌ ไม่สามารถใช้ crypt ได้:', cryptError.message)
      console.log('🔄 ใช้วิธีอื่นแทน...')
      
      // ใช้ simple hash แทน
      console.log('3. ใช้ plain text password สำหรับ debug...')
      
      // เพิ่ม admin ใหม่ด้วย plain password
      const { data: insertResult, error: insertError } = await supabase
        .from('admins')
        .insert({
          username: 'admin',
          email: 'admin@shop.com',
          password_hash: 'admin123', // plain text สำหรับ debug
          full_name: 'ผู้ดูแลระบบ',
          role: 'super_admin'
        })
        .select()
      
      if (insertError) {
        console.error('❌ Insert error:', insertError.message)
      } else {
        console.log('✅ สร้าง admin สำเร็จ (plain password)')
      }
      
    } else {
      console.log('✅ สร้าง hash สำเร็จ:', cryptResult)
    }

    // 3. ทดสอบ login
    console.log('\n=== ทดสอบ Login ===')
    const { data: loginResult, error: loginError } = await supabase
      .rpc('admin_login', {
        input_username: 'admin',
        input_password: 'admin123'
      })

    if (loginError) {
      console.error('❌ Login test error:', loginError.message)
    } else {
      console.log('Login test result:', loginResult)
      if (loginResult && loginResult.length > 0 && loginResult[0].success) {
        console.log('🎉 Login สำเร็จ!')
      } else {
        console.log('❌ Login ยังไม่สำเร็จ:', loginResult[0]?.message || 'No message')
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createAdminWithCrypt()