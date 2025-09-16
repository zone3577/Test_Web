// Debug password hash ใน Supabase
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

async function debugPassword() {
  try {
    console.log('=== Debug Password Hash ===')
    
    // ตรวจสอบ password hash ใน database
    const { data: admin, error } = await supabase
      .from('admins')
      .select('username, password_hash')
      .eq('username', 'admin')
      .single()

    if (error) {
      console.error('❌ Error:', error.message)
      return
    }

    console.log('Username:', admin.username)
    console.log('Password Hash:', admin.password_hash)
    console.log('Hash Length:', admin.password_hash.length)
    console.log('Hash Type:', admin.password_hash.startsWith('$2') ? 'bcrypt' : 'unknown')
    
    // ตรวจสอบว่า bcrypt extension มีอยู่ไหม
    console.log('\n=== ตรวจสอบ bcrypt extension ===')
    const { data: extensions, error: extError } = await supabase
      .rpc('exec', { sql: "SELECT * FROM pg_extension WHERE extname = 'pg_crypto';" })
      .single()

    if (extError) {
      console.log('❌ ไม่สามารถตรวจสอบ extension:', extError.message)
    } else {
      console.log('✅ pg_crypto extension status:', extensions ? 'Installed' : 'Not installed')
    }

    // ลองทดสอบ crypt function
    console.log('\n=== ทดสอบ crypt function ===')
    
    const testPassword = 'admin123'
    const storedHash = admin.password_hash
    
    // ลองใช้ crypt ตรวจสอบ
    const { data: cryptTest, error: cryptError } = await supabase
      .rpc('exec', { 
        sql: `SELECT crypt('${testPassword}', '${storedHash}') = '${storedHash}' as password_match;` 
      })

    if (cryptError) {
      console.error('❌ crypt test error:', cryptError.message)
    } else {
      console.log('crypt test result:', cryptTest)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugPassword()