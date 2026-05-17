import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chat/:path*',
    '/food-log/:path*',
    '/workout/:path*',
    '/body/:path*',
    '/plan/:path*',
    '/progress/:path*',
    '/onboarding/:path*',
    '/upgrade/:path*',
  ],
}
