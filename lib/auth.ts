import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseServer } from './supabase-server';
import { NEXTAUTH_SECRET } from './env';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@student.edu' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const db = supabaseServer();

        let { data: student } = await db
          .from('students')
          .select('id, email, name, has_onboarded')
          .eq('email', credentials.email)
          .single();

        if (!student && process.env.NODE_ENV === 'development') {
          const { data: newStudent, error } = await db
            .from('students')
            .insert({
              email: credentials.email,
              name: credentials.email.split('@')[0],
              has_onboarded: false,
            })
            .select('id, email, name, has_onboarded')
            .single();

          if (error) {
            console.error('[auth] Failed to create student:', error);
            return null;
          }
          student = newStudent;
        }

        if (!student) return null;

        return {
          id: student.id,
          email: student.email,
          name: student.name ?? credentials.email,
          hasOnboarded: student.has_onboarded,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.hasOnboarded = (user as any).hasOnboarded;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session as any).hasOnboarded = token.hasOnboarded;
      }
      return session;
    },
  },
  secret: NEXTAUTH_SECRET(),
};
