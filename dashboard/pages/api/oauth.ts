import { sign } from 'jsonwebtoken'
import type { NextApiRequest, NextApiResponse } from 'next'
import { clientId, clientSecret, jwtSecret, rootUrl } from '../../imports/config'

const scope = ['identify', 'guilds'].join(' ')
const secure =
  rootUrl.startsWith('https') && process.env.NODE_ENV !== 'development' ? '; Secure' : ''
const REDIRECT_URI = `${rootUrl}/api/oauth`
const OAUTH_QS = new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope,
}).toString()
const OAUTH_URI = `https://discord.com/api/oauth2/authorize?${OAUTH_QS}`

export default async (req: NextApiRequest, res: NextApiResponse): Promise<NextApiResponse> => {
  if (req.method !== 'GET') return res.redirect('/dashboard')
  const { code, error } = req.query

  if (error) {
    return res.redirect(
      `/error?error=${encodeURIComponent(req.query.error?.toString() ?? 'Unknown error')}`,
    )
  } else if (!code || typeof code !== 'string') {
    return res.redirect(OAUTH_URI)
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
    code,
    scope,
  }).toString()

  const {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
  } = await fetch('https://discord.com/api/oauth2/token', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
    body,
  }).then(async res => (await res.json()) as Record<string, unknown>)

  if (
    typeof accessToken !== 'string' ||
    typeof refreshToken !== 'string' ||
    typeof expiresIn !== 'number'
  ) {
    return res.redirect(OAUTH_URI)
  }

  const token = sign({ accessToken, refreshToken, scope }, jwtSecret, { expiresIn })
  res.setHeader(
    'Set-Cookie',
    `Discord-OAuth="${token}"; HttpOnly; Max-Age=2678400; SameSite=Lax${secure}`,
  )
  return res.redirect('/dashboard')
}
