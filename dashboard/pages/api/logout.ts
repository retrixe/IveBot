import { type JwtPayload, verify } from 'jsonwebtoken'
import type { NextApiRequest, NextApiResponse } from 'next'
import config from '../../config.json'
const { rootUrl, clientId, clientSecret, jwtSecret } = config

const secure = rootUrl.startsWith('https') && process.env.NODE_ENV !== 'development' ? '; Secure' : ''

const getToken = async (req: NextApiRequest): Promise<string | undefined> => {
  const token = req.cookies['Discord-OAuth']
  if (!token) return
  // Check if it's a JWT token issued by us.
  try {
    const decoded: string | JwtPayload | undefined = await new Promise((resolve, reject) => {
      verify(
        token, jwtSecret, { ignoreExpiration: true },
        (err, decoded) => (err ? reject(err) : resolve(decoded))
      )
    })
    return typeof decoded === 'string' ? undefined : decoded?.refreshToken
  } catch (e) {}
}

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const token = await getToken(req)
  if (!token) return res.status(401).json({ error: 'No proper token provided to revoke!' })

  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, token }).toString()
  const response = await fetch('https://discord.com/api/oauth2/token/revoke', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, method: 'POST', body
  })
  if (!response.ok) {
    return res.status(400).json({ error: 'An error occurred when asking Discord to revoke token.' })
  }

  res.setHeader('Set-Cookie', `Discord-OAuth="removed"; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secure}`)
  return res.status(204).send(undefined)
}
