export const extractAccessToken = (payload) => {
  if (!payload || typeof payload !== 'object') return null

  const candidates = [
    payload.accessToken,
    payload.token,
    payload.access_token,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }

  return null
}

export const extractRefreshToken = (payload) => {
  if (!payload || typeof payload !== 'object') return null

  const candidates = [
    payload.refreshToken,
    payload.refresh_token,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }

  return null
}
