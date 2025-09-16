// สร้าง bcrypt hash ใหม่สำหรับ admin123
const bcrypt = require('bcrypt')

async function generateHash() {
  try {
    const password = 'admin123'
    const saltRounds = 10
    
    const hash = await bcrypt.hash(password, saltRounds)
    console.log('Password:', password)
    console.log('New Hash:', hash)
    console.log('Length:', hash.length)
    
    // ตรวจสอบว่า hash ใหม่ verify ได้
    const isValid = await bcrypt.compare(password, hash)
    console.log('Verification:', isValid ? '✅ Valid' : '❌ Invalid')
    
    console.log('\n=== SQL สำหรับอัพเดท ===')
    console.log(`UPDATE admins SET password_hash = '${hash}' WHERE username = 'admin';`)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

generateHash()