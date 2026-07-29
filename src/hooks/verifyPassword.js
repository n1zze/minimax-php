import { api } from '../api'

/**
 * Verify password against the server (never client-side bcrypt).
 * Falls back to unlock attempt — if it succeeds, the password is correct.
 */
export async function verifyPassword(projectId, password) {
  try {
    const result = await api.unlock(projectId, password)
    return !!result?.token
  } catch {
    return false
  }
}
