'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router   = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    } else {
      router.push('/onboard');
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="form-card"
        style={{ margin: 0 }} // Center properly
      >
        <div className="form-logo-row" style={{ justifyContent: 'center' }}>
          <div className="form-logo-mark">CM</div>
          <div className="form-logo-text">CampusMind</div>
        </div>
        <p className="form-subtitle" style={{ textAlign: 'center' }}>Sign in to your campus assistant</p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="field-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@student.edu"
              required
              className="form-input"
            />
          </div>

          <div className="form-field" style={{ marginBottom: '24px' }}>
            <label className="field-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="form-input"
            />
          </div>

          {error && (
            <span className="field-error" style={{ marginBottom: '16px' }}>
              {error}
            </span>
          )}

          <button
            type="submit"
            disabled={loading}
            className="form-submit"
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>
          New here? Just enter any email — we'll create your account automatically.
        </p>
      </motion.div>
    </div>
  );
}
