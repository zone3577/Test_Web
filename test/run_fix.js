// รัน SQL เพื่อแก้ไข admin_login function
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

async function fixAdminLogin() {
  try {
    console.log('=== แก้ไข admin_login function ===')
    
    // อ่าน SQL file
    const sqlContent = fs.readFileSync(path.join(__dirname, 'fix_admin_login.sql'), 'utf8')
    console.log('SQL Content length:', sqlContent.length)
    
    // รัน SQL โดยใช้ rpc call แต่ละคำสั่ง
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';'
      console.log(`\nRunning command ${i + 1}:`, command.substring(0, 100) + '...')
      
      try {
        // ใช้ rpc แทน
        if (command.includes('DROP FUNCTION')) {
          console.log('Skipping DROP FUNCTION (may not exist)')
          continue
        }
        
        if (command.includes('CREATE OR REPLACE FUNCTION')) {
          // สำหรับ function ให้ใช้ผ่าน Supabase Dashboard
          console.log('⚠️  Function creation ต้องทำผ่าน Supabase Dashboard')
          console.log('คัดลอก SQL นี้ไปรันใน Dashboard:')
          console.log(command)
        }
      } catch (error) {
        console.error(`❌ Error in command ${i + 1}:`, error.message)
      }
    }
    
    console.log('\n✅ ต้องไปรัน SQL ใน Supabase Dashboard เอง')
    console.log('📍 Supabase → SQL Editor → Paste the CREATE FUNCTION command')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixAdminLogin()