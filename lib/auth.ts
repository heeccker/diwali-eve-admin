import bcrypt from 'bcryptjs'

const ADMIN_PASSWORD = 'Disha@69'

export async function verifyAdminPassword(inputPassword: string): Promise<boolean> {
  try {
    // In development, we'll compare directly
    // In production, you should use the hashed password from environment
    return inputPassword === ADMIN_PASSWORD
    
    // For production use:
    // const hashedPassword = process.env.ADMIN_PASSWORD_HASH
    // if (!hashedPassword) return false
    // return await bcrypt.compare(inputPassword, hashedPassword)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

export function generatePasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}