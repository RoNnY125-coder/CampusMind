// app/api/auth/[...nextauth]/route.ts
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
        console.log('[auth] authorize called with email:', credentials?.email);
        console.log('[auth] env vars present:', {
          supabaseUrl:    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceKey:     !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          nextauthSecret: !!process.env.NEXTAUTH_SECRET,
        });

        if (!credentials?.email) {
          console.log('[auth] no email provided');
          return null;
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

        // If Supabase is not configured, fall back to a simple demo login
        if (!supabaseUrl || !serviceKey) {
          console.log('[auth] Supabase not configured — using fallback demo login');
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

          console.log('[auth] checking for existing student...');
          const { data: existing, error: fetchError } = await db
            .from('students')
            .select('id, email, name, has_onboarded')
            .eq('email', credentials.email)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 = row not found, which is fine
            console.error('[auth] fetch error:', fetchError.message, fetchError.code);
          }

          if (existing) {
            console.log('[auth] existing student found:', existing.id);
            return {
              id:           existing.id,
              email:        existing.email,
              name:         existing.name ?? credentials.email.split('@')[0],
              hasOnboarded: existing.has_onboarded,
            };
          }

          console.log('[auth] creating new student...');
          console.log('[auth] supabase config:', {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
            keyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20),
          });
          const { data: newStudent, error: insertError } = await db
            .from('students')
            .insert({
              email:         credentials.email,
              name:          credentials.email.split('@')[0],
              has_onboarded: false,
            })
            .select('id, email, name, has_onboarded')
            .single();

          if (insertError) {
            console.error('[auth] insert error:', insertError.message, insertError.code, insertError.details);
            // Fall back to a non-DB session so login still works
            return {
              id:           crypto.randomUUID(),
              email:        credentials.email,
              name:         credentials.email.split('@')[0],
              hasOnboarded: false,
            };
          }

          console.log('[auth] new student created:', newStudent.id);
          return {
            id:           newStudent.id,
            email:        newStudent.email,
            name:         newStudent.name,
            hasOnboarded: false,
          };

        } catch (err: any) {
          console.error('[auth] unexpected error:', err?.message ?? err);
          // Fall back so login always works even if DB is down
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

  pages: { signIn: '/login' },

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
        (session as any).hasOnboarded = token.hasOnboarded ?? false;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
