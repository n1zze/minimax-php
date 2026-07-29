import { describe, it, expect } from 'vitest'
import { verifyPassword } from '../hooks/verifyPassword'
import bcrypt from 'bcryptjs'

describe('verifyPassword', () => {
  it('returns true for correct password', () => {
    const hash = bcrypt.hashSync('secret', 10)
    expect(verifyPassword('secret', hash)).toBe(true)
  })

  it('returns false for incorrect password', () => {
    const hash = bcrypt.hashSync('secret', 10)
    expect(verifyPassword('wrong', hash)).toBe(false)
  })

  it('returns false for empty password', () => {
    const hash = bcrypt.hashSync('secret', 10)
    expect(verifyPassword('', hash)).toBe(false)
  })

  it('works with the mock project hash', () => {
    const mockHash = '$2b$10$JlUlOXEGTbzW6fPkxY.DhuWFOLSFTl62/AIfiku4b9078vnrZ4q8i'
    expect(verifyPassword('secret', mockHash)).toBe(true)
  })

  it('rejects wrong password for mock hash', () => {
    const mockHash = '$2b$10$JlUlOXEGTbzW6fPkxY.DhuWFOLSFTl62/AIfiku4b9078vnrZ4q8i'
    expect(verifyPassword('password', mockHash)).toBe(false)
  })
})
