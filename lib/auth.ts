import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email:    { label: 'Email',    type: 'email',    placeholder: 'you@student.edu' },
        password: { label: 'Password', type: 'password', placeholder: '••••••••' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        try {
          // Dynamically import to avoid build-time errors
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

          if (!supabaseUrl || !serviceKey) {
            console.error('[auth] Supabase env vars missing');
            return null;
          }

          const db = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false },
          });

          // Try to find existing student
          const { data: existing } = await db
            .from('students')
            .select('id, email, name, has_onboarded')
            .eq('email', credentials.email)
            .single();

          if (existing) {
            return {
              id:           existing.id,
              email:        existing.email,
              name:         existing.name ?? credentials.email.split('@')[0],
              hasOnboarded: existing.has_onboarded,
            };
          }

          // Auto-create new student on first login
          const { data: newStudent, error } = await db
            .from('students')
            .insert({
              email:         credentials.email,
              name:          credentials.email.split('@')[0],
              has_onboarded: false,
            })
            .select('id, email, name, has_onboarded')
            .single();

          if (error || !newStudent) {
            console.error('[auth] Failed to create student:', error);
            return null;
          }

          return {
            id:           newStudent.id,
            email:        newStudent.email,
            name:         newStudent.name,
            hasOnboarded: false,
          };
        } catch (err) {
          console.error('[auth] authorize error:', err);
          return null;
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id           = user.id;
        token.hasOnboarded = (user as any).hasOnboarded ?? false;
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

  // Use process.env directly — NextAuth reads this lazily at runtime, not build time
  secret: process.env.NEXTAUTH_SECRET,
};
