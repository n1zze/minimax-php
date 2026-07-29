import { describe, it, expect, vi } from 'vitest'
import { verifyPassword } from '../hooks/verifyPassword'

// Mock the API module
vi.mock('../api', () => ({
  api: {
    unlock: vi.fn(),
  },
}))

import { api } from '../api'

describe('verifyPassword', () => {
  it('returns true when server accepts the password', async () => {
    api.unlock.mockResolvedValue({ token: 'abc123' })
    expect(await verifyPassword('proj-1', 'secret')).toBe(true)
  })

  it('returns false when server rejects the password', async () => {
    api.unlock.mockRejectedValue(new Error('Invalid password'))
    expect(await verifyPassword('proj-1', 'wrong')).toBe(false)
  })

  it('returns false when server returns no token', async () => {
    api.unlock.mockResolvedValue({})
    expect(await verifyPassword('proj-1', 'secret')).toBe(false)
  })
})
