import bcrypt from 'bcryptjs'

/**
 * Verify a plain-text password against a bcrypt hash.
 * Works synchronously (suitable for client-side demo).
 */
export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash)
}
