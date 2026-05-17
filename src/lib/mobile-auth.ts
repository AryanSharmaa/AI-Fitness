import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

interface MobileSession {
  userId: string
  email: string
}

export async function getMobileSession(req: NextRequest): Promise<MobileSession | null> {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7)
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? 'secret')
      const { payload } = await jwtVerify(token, secret)
      if (payload.uid && payload.email) {
        return { userId: payload.uid as string, email: payload.email as string }
      }
    } catch {
      return null
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
