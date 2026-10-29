import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Vui lòng nhập email và mật khẩu');
        }
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email.toLowerCase()))
          .limit(1);
        if (!user) throw new Error('Email hoặc mật khẩu không đúng');
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) throw new Error('Email hoặc mật khẩu không đúng');
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = (user as any).role; }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
