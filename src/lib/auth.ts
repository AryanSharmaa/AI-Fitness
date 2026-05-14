import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || 'smtp.resend.com',
        port: Number(process.env.EMAIL_SERVER_PORT) || 465,
        auth: {
          user: process.env.EMAIL_SERVER_USER || 'resend',
          pass: process.env.RESEND_API_KEY || '',
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@localhost',
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      // Upsert user in DB
      await prisma.user.upsert({
        where: { email: user.email },
        create: { email: user.email, name: user.name ?? null },
        update: {},
      })
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user?.email) {
        // Look up the real DB id
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
        if (dbUser) token.sub = dbUser.id
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=true',
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
