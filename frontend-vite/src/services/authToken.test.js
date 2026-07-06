import { describe, expect, it } from 'vitest'
import { extractAccessToken } from './authToken'

describe('extractAccessToken', () => {
  it('returns the access token from a refresh response payload', () => {
    const payload = { accessToken: 'fresh-token' }
    expect(extractAccessToken(payload)).toBe('fresh-token')
  })

  it('falls back to token when the backend uses the older field name', () => {
    const payload = { token: 'legacy-token' }
    expect(extractAccessToken(payload)).toBe('legacy-token')
  })

  it('returns null when no access token is present', () => {
    expect(extractAccessToken({ message: 'ok' })).toBeNull()
  })
})
