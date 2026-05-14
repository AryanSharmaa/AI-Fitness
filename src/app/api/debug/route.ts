import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getToken } from 'next-auth/jwt'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const cookies: Record<string, string> = {}
  req.cookies.getAll().forEach(c => {
    cookies[c.name] = c.value.slice(0, 20) + '...'
  })

  return NextResponse.json({
    session,
    token,
    cookies,
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    }
  })
}
