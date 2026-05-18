import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

interface MobileSession {
  userId: string
  email: string
}

function verifyToken(token: string): { uid: string; email: string } | null {
  try {
    const crypto = require('crypto')
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, body, sig] = parts
    const secret = process.env.NEXTAUTH_SECRET ?? 'fitmind-secret'
    const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(body, 'base64').toString())
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return { uid: payload.uid, email: payload.email }
  } catch {
    return null
  }
}

export async function getMobileSession(req: NextRequest): Promise<MobileSession | null> {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7)
    const payload = verifyToken(token)
    if (payload) {
      return { userId: payload.uid, email: payload.email }
    }
  }
  return null
}

export async function getAnySession(req: NextRequest): Promise<MobileSession | null> {
  const mobile = await getMobileSession(req)
  if (mobile) return mobile

  // @ts-expect-error next-auth getServerSession does not accept NextRequest directly
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return { userId: session.user.id, email: session.user.email ?? '' }
  }
  return null
}
