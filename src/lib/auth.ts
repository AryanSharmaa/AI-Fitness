import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'otp',
      name: 'OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.otp) return null
          const email = credentials.email.toLowerCase().trim()
          const otp = credentials.otp.trim()

          const record = await prisma.verificationToken.findFirst({
            where: {
              identifier: email,
              token: otp,
              expires: { gt: new Date() },
            },
          })
          if (!record) return null

          await prisma.verificationToken.deleteMany({
            where: { identifier: email },
          })

          const user = await prisma.user.upsert({
            where: { email },
            create: { email },
            update: {},
          })

          return { id: user.id, email: user.email ?? '' }
        } catch (err) {
          console.error('authorize error:', err)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string
      if (token.email) session.user.email = token.email as string
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
