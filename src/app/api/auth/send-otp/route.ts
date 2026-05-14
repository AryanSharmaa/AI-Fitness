import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const otp = generateOTP()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing OTPs for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    })

    // Store new OTP
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: otp,
        expires,
      },
    })

    // Send via Resend HTTP API
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      // Dev mode: log OTP to console
      console.log(`[DEV] OTP for ${normalizedEmail}: ${otp}`)
      return NextResponse.json({ ok: true, dev: true })
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'FitMind AI <onboarding@resend.dev>',
        to: normalizedEmail,
        subject: 'Your FitMind AI login code',
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px">
            <h2 style="color:#059669">FitMind AI</h2>
            <p>Your login code is:</p>
            <div style="font-size:40px;font-weight:bold;letter-spacing:8px;color:#059669;margin:24px 0">${otp}</div>
            <p style="color:#6b7280;font-size:14px">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      const err = await emailRes.text()
      console.error('Resend error:', err)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
