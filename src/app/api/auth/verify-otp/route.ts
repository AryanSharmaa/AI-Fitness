import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()
    if (!email || !otp) {
      return NextResponse.json({ error: 'email and otp required' }, { status: 400 })
    }

    const normalised = email.toLowerCase().trim()

    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: normalised,
        token: otp.trim(),
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

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? 'secret')
    const token = await new SignJWT({ uid: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: (user.plan === 'pro' ? 'PRO' : 'FREE') as 'FREE' | 'PRO',
      },
    })
  } catch (err) {
    console.error('verify-otp error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
