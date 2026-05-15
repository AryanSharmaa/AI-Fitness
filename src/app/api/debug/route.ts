import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const cookies: Record<string, string> = {}
  req.cookies.getAll().forEach(c => {
    cookies[c.name] = c.value.slice(0, 30) + '...'
  })

  return NextResponse.json({
    ok: true,
    cookies,
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    }
  })
}
