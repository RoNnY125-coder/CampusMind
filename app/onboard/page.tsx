'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function OnboardPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    college: 'VIT Bhopal University',
    branch: '',
    year: '',
    clubs: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);

    if (formData.name.trim().length < 2 || formData.branch.trim().length < 2 || !formData.year) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const userId = (session?.user as any)?.id;
      if (!userId) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          interests: [],
          clubs: formData.clubs ? formData.clubs.split(',').map(c => c.trim()).filter(Boolean) : [],
          userId,
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? 'Onboarding failed');
      }

      // Save to localStorage as requested
      const userProfile = {
        name: formData.name.trim(),
        college: formData.college,
        branch: formData.branch.trim(),
        year: formData.year,
        clubs: formData.clubs.trim(),
      };
      localStorage.setItem("campusmind_user", JSON.stringify(userProfile));

      await update({ hasOnboarded: true });
      window.location.href = '/chat';
    } catch (submitError) {
      console.error('[onboard] submit error:', submitError);
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="typing-dot" style={{ background: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="form-card"
        style={{ margin: 0 }}
      >
        <div className="form-logo-row">
          <div className="form-logo-mark">CM</div>
          <div className="form-logo-text">Tell us about yourself</div>
        </div>
        <p className="form-subtitle">CampusMind will personalise every answer for you</p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="field-label">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Priya Sharma"
              className="form-input"
            />
            {submittedOnce && formData.name.trim().length < 2 && (
              <span className="field-error">Name must be at least 2 characters</span>
            )}
          </div>

          <div className="form-field">
            <label className="field-label">College</label>
            <div className="form-select-wrapper">
              <select
                value={formData.college}
                onChange={(e) => setFormData((prev) => ({ ...prev, college: e.target.value }))}
                className="form-select"
              >
                <option value="VIT Bhopal University">VIT Bhopal University</option>
                <option value="VIT Vellore" disabled>VIT Vellore (coming soon)</option>
                <option value="VIT Chennai" disabled>VIT Chennai (coming soon)</option>
                <option value="VIT AP" disabled>VIT AP (coming soon)</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">Branch</label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData((prev) => ({ ...prev, branch: e.target.value }))}
              placeholder="e.g. Computer Science"
              className="form-input"
            />
            {submittedOnce && formData.branch.trim().length < 2 && (
              <span className="field-error">Branch must be at least 2 characters</span>
            )}
          </div>

          <div className="form-field">
            <label className="field-label">Year</label>
            <div className="form-select-wrapper">
              <select
                value={formData.year}
                onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                className="form-select"
              >
                <option value="" disabled>Select your year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            {submittedOnce && !formData.year && (
              <span className="field-error">Please select your year</span>
            )}
          </div>

          <div className="form-field">
            <label className="field-label">Clubs of Interest (optional)</label>
            <input
              type="text"
              value={formData.clubs}
              onChange={(e) => setFormData((prev) => ({ ...prev, clubs: e.target.value }))}
              placeholder="e.g. AI Club, Robotics Club, Music & Band Club"
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
            disabled={isSubmitting}
            className="form-submit"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
