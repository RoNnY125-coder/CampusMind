import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
 
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
 
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
 
        if (!supabaseUrl || !serviceKey) {
          return {
            id:           crypto.randomUUID(),
            email:        credentials.email,
            name:         credentials.email.split('@')[0],
            hasOnboarded: false,
          };
        }
 
        try {
          const db = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false },
          });
 
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
 
          const { data: newStudent, error: insertError } = await db
            .from('students')
            .insert({
              email:         credentials.email,
              name:          credentials.email.split('@')[0],
              has_onboarded: false,
            })
            .select('id, email, name, has_onboarded')
            .single();
 
          if (insertError || !newStudent) {
            console.error('[auth] insert error:', insertError);
            return {
              id:           crypto.randomUUID(),
              email:        credentials.email,
              name:         credentials.email.split('@')[0],
              hasOnboarded: false,
            };
          }
 
          return {
            id:           newStudent.id,
            email:        newStudent.email,
            name:         newStudent.name,
            hasOnboarded: false,
          };
 
        } catch (err: any) {
          console.error('[auth] error:', err?.message);
          return {
            id:           crypto.randomUUID(),
            email:        credentials.email,
            name:         credentials.email.split('@')[0],
            hasOnboarded: false,
          };
        }
      },
    }),
  ],
 
  session: { strategy: 'jwt' },
  pages:   { signIn: '/login' },
 
  callbacks: {
    async jwt({ token, user, trigger, session: sessionData }: any) {
      if (user) {
        token.id           = user.id;
        token.hasOnboarded = user.hasOnboarded ?? false;
      }
      if (trigger === 'update' && sessionData?.hasOnboarded !== undefined) {
        token.hasOnboarded = sessionData.hasOnboarded;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id       = token.id;
        session.hasOnboarded  = token.hasOnboarded ?? false;
      }
      return session;
    },
  },
 
  secret: process.env.NEXTAUTH_SECRET,
});
 
export { handler as GET, handler as POST };
