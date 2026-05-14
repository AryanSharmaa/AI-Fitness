import { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import type { Adapter, AdapterUser, AdapterSession, AdapterAccount, VerificationToken } from 'next-auth/adapters'
import { prisma } from './prisma'

function CustomPrismaAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, 'id'>) {
      return prisma.user.create({ data: user }) as any
    },
    async getUser(id: string) {
      return prisma.user.findUnique({ where: { id } }) as any
    },
    async getUserByEmail(email: string) {
      return prisma.user.findUnique({ where: { email } }) as any
    },
    async getUserByAccount({ providerAccountId, provider }: Pick<AdapterAccount, 'providerAccountId' | 'provider'>) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      }) as any
      return account?.user ?? null
    },
    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, 'id'>) {
      return prisma.user.update({ where: { id: user.id }, data: user }) as any
    },
    async deleteUser(userId: string) {
      return prisma.user.delete({ where: { id: userId } }) as any
    },
    async linkAccount(account: AdapterAccount) {
      await prisma.account.create({ data: account as any })
    },
    async unlinkAccount({ providerAccountId, provider }: Pick<AdapterAccount, 'providerAccountId' | 'provider'>) {
      await prisma.account.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      })
    },
    async createSession(session: { sessionToken: string; userId: string; expires: Date }) {
      return prisma.session.create({ data: session }) as any
    },
    async getSessionAndUser(sessionToken: string) {
      const s = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      }) as any
      if (!s) return null
      const { user, ...session } = s
      return { session, user }
    },
    async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>) {
      return prisma.session.update({
        where: { sessionToken: session.sessionToken },
        data: session,
      }) as any
    },
    async deleteSession(sessionToken: string) {
      return prisma.session.delete({ where: { sessionToken } }) as any
    },
    async createVerificationToken(token: VerificationToken) {
      return prisma.verificationToken.create({ data: token }) as any
    },
    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      try {
        return await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        }) as any
      } catch {
        return null
      }
    },
  }
}

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(),
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
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id
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
