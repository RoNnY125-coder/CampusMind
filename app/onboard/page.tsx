'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/components/SupabaseAuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { CLUB_NAMES, CLUBS } from '@/lib/clubs';
import { supabase } from '@/lib/supabase';
import { saveProfile } from '@/lib/user-profile-storage';

export default function OnboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [clubSearch, setClubSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    college: 'VIT Bhopal University',
    branch: '',
    year: '',
    clubs: [] as string[],
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push('/login');
  }, [authLoading, user, router]);

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
      const userId = user?.id;
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
      saveProfile(userProfile);

      // Update has_onboarded in the students table
      await supabase
        .from('students')
        .update({ has_onboarded: true })
        .eq('id', userId);

      router.push('/chat');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Clubs and communities 🚀</h3>
                  <span className="text-blue-400 text-xs">{formData.clubs.length} selected</span>
                </div>

                {/* Search bar — NEW */}
                <div className="relative" style={{ marginTop: '16px' }}>
                  <input
                    type="text"
                    placeholder="Search clubs..."
                    value={clubSearch}
                    onChange={e => setClubSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-500 outline-none focus:border-blue-500/60 pr-10 transition-all"
                  />
                  {clubSearch && (
                    <button
                      onClick={() => setClubSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filtered clubs grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1" style={{ marginTop: '16px' }}>
                  {CLUBS
                    .filter(club =>
                      club.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
                      club.desc.toLowerCase().includes(clubSearch.toLowerCase())
                    )
                    .map(club => (
                      <button
                        key={club.name}
                        onClick={() => toggleClub(club.name)}
                        className="rounded-xl border p-4 text-left transition-all hover:scale-[1.02]"
                        style={{
                          background:  formData.clubs.includes(club.name) ? 'rgba(59,130,246,0.2)'  : 'rgba(255,255,255,0.03)',
                          borderColor: formData.clubs.includes(club.name) ? 'rgba(59,130,246,0.6)'  : 'rgba(255,255,255,0.1)',
                          boxShadow:   formData.clubs.includes(club.name) ? '0 0 16px rgba(59,130,246,0.15)' : 'none',
                        }}
                      >
                        <p className="font-medium text-sm text-white">{club.name}</p>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">{club.desc}</p>
                      </button>
                    ))
                  }
                  {CLUBS.filter(club =>
                    club.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
                    club.desc.toLowerCase().includes(clubSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="text-gray-500 text-sm col-span-2 text-center py-4">
                      No clubs found for "{clubSearch}"
                    </p>
                  )}
                </div>
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
