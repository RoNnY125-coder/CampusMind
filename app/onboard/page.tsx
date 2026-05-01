'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CAMPUS_CLUBS } from '@/lib/data/clubs';

export default function OnboardPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    college: 'VIT Bhopal University',
    branch: '',
    year: '',
    clubs: [] as string[],
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const toggleClub = (club: string) => {
    setFormData(prev => ({
      ...prev,
      clubs: prev.clubs.includes(club) ? prev.clubs.filter(c => c !== club) : [...prev.clubs, club]
    }));
  };

  const handleNext = () => {
    setSubmittedOnce(true);
    if (step === 1 && formData.name.trim().length < 2) return;
    if (step === 2 && formData.branch.trim().length < 2) return;
    if (step === 3 && !formData.year) return;
    setSubmittedOnce(false);
    setDirection(1);
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(prev => prev - 1);
    setSubmittedOnce(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const userId = (session?.user as any)?.id;
      if (!userId) { router.push('/login'); return; }
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, interests: [], userId }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? 'Onboarding failed');
      const userProfile = {
        name: formData.name.trim(),
        college: formData.college,
        branch: formData.branch.trim(),
        year: formData.year,
        clubs: formData.clubs.join(', '),
      };
      localStorage.setItem("campusmind_user", JSON.stringify(userProfile));
      await update({ hasOnboarded: true });
      window.location.href = '/chat';
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="screen-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="typing-dot" />
      </div>
    );
  }

  const slideVariants = {
    initial: (dir: number) => ({ opacity: 0, x: dir * 200 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -200 })
  };

  return (
    <div className="screen-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <button onClick={() => router.back()} className="back-btn" aria-label="Go back">
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="form-card"
        style={{ margin: 0, overflow: 'hidden', position: 'relative', zIndex: 1 }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
          Step {step} of 4
        </div>

        {/* Step progress bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map(num => (
            <div key={num} className={`step-bar-segment ${num <= step ? 'active' : ''}`} />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div key="step1" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <h2 style={{ color: 'var(--text)', fontSize: '20px', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>What&apos;s your name?</h2>
              <p className="form-subtitle">Let&apos;s get to know each other.</p>
              <div className="form-field" style={{ marginTop: '24px' }}>
                <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Priya Sharma" className="form-input" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleNext()} />
                {submittedOnce && formData.name.trim().length < 2 && <span className="field-error">Name must be at least 2 characters</span>}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <h2 style={{ color: 'var(--text)', fontSize: '20px', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Where do you study?</h2>
              <p className="form-subtitle">We&apos;ll tailor campus events for you.</p>
              <div className="form-field" style={{ marginTop: '24px' }}>
                <label className="field-label">College</label>
                <div className="form-select-wrapper">
                  <select value={formData.college} onChange={(e) => setFormData(prev => ({ ...prev, college: e.target.value }))} className="form-select">
                    <option value="VIT Bhopal University">VIT Bhopal University</option>
                    <option value="VIT Vellore" disabled>VIT Vellore (coming soon)</option>
                    <option value="VIT Chennai" disabled>VIT Chennai (coming soon)</option>
                    <option value="VIT AP" disabled>VIT AP (coming soon)</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label className="field-label">Branch</label>
                <input type="text" value={formData.branch} onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))} placeholder="e.g. Computer Science" className="form-input" onKeyDown={(e) => e.key === 'Enter' && handleNext()} />
                {submittedOnce && formData.branch.trim().length < 2 && <span className="field-error">Branch must be at least 2 characters</span>}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <h2 style={{ color: 'var(--text)', fontSize: '20px', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>What year are you in?</h2>
              <p className="form-subtitle">To recommend relevant academic materials.</p>
              <div className="form-field" style={{ marginTop: '24px' }}>
                <div className="form-select-wrapper">
                  <select value={formData.year} onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))} className="form-select">
                    <option value="" disabled>Select your year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                {submittedOnce && !formData.year && <span className="field-error">Please select your year</span>}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <h2 style={{ color: 'var(--text)', fontSize: '20px', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Clubs of Interest</h2>
              <p className="form-subtitle">Select clubs you are part of or interested in.</p>
              <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                {CAMPUS_CLUBS.map((club) => {
                  const isSelected = formData.clubs.includes(club);
                  return (
                    <button key={club} type="button" onClick={() => toggleClub(club)} style={{
                      padding: '8px 18px', borderRadius: 'var(--r-pill)', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'var(--font-body)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: isSelected ? 'rgba(212,212,212,0.15)' : 'var(--surface2)',
                      color: isSelected ? 'var(--accent2)' : 'var(--text2)',
                      boxShadow: isSelected ? '0 0 12px rgba(212,212,212,0.2)' : 'none',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.background = 'var(--pearl-dim)'; e.currentTarget.style.borderColor = 'rgba(240,238,248,0.2)'; e.currentTarget.style.color = 'var(--pearl)'; }}}
                    onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}}
                    >{club}</button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <span className="field-error" style={{ display: 'block', marginTop: '16px' }}>{error}</span>}

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          {step > 1 && (
            <button type="button" onClick={handleBack} disabled={isSubmitting} className="btn btn-ghost" style={{ flex: 1, padding: '14px' }}>Back</button>
          )}
          {step < 4 ? (
            <button type="button" onClick={handleNext} className="form-submit" style={{ flex: 2 }}>Continue</button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="form-submit" style={{ flex: 2 }}>{isSubmitting ? 'Saving...' : 'Finish Setup'}</button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
