import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple base64url encode (no external deps)
function base64url(str: string) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function makeToken(payload: object): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }))
  // For mobile-only use: sign with a simple HMAC using Node crypto
  const crypto = require('crypto')
  const secret = process.env.NEXTAUTH_SECRET ?? 'fitmind-secret'
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${body}.${sig}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, otp } = body

    if (!email || !otp) {
      return NextResponse.json({ error: 'email and otp required' }, { status: 400 })
    }

    const normalised = (email as string).toLowerCase().trim()

    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: normalised,
        token: (otp as string).trim(),
        expires: { gt: new Date() },
      },
    })

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 })
    }

    await prisma.verificationToken.deleteMany({ where: { identifier: normalised } })

    const user = await prisma.user.upsert({
      where: { email: normalised },
      create: { email: normalised },
      update: {},
      select: { id: true, email: true, name: true, plan: true },
    })

    const token = makeToken({ uid: user.id, email: user.email })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan === 'pro' ? 'PRO' : 'FREE',
      },
    })
  } catch (err: any) {
    console.error('verify-otp error:', err?.message, err?.stack)
    return NextResponse.json({ error: 'Server error', detail: err?.message }, { status: 500 })
  }
}
