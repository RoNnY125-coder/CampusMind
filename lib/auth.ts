import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Demo users for testing
const demoUsers = [
  {
    id: '1',
    email: 'rahul@student.edu',
    password: 'password123',
    name: 'Rahul Sharma',
    hasOnboarded: true,
  },
  {
    id: '2',
    email: 'priya@student.edu',
    password: 'password123',
    name: 'Priya Gupta',
    hasOnboarded: true,
  },
  {
    id: '3',
    email: 'arjun@student.edu',
    password: 'password123',
    name: 'Arjun Singh',
    hasOnboarded: false,
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = demoUsers.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          hasOnboarded: user.hasOnboarded,
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
  secret: process.env.NEXTAUTH_SECRET,
};
