'use client';
 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
 
interface FormData {
  name: string;
  year: string;
  branch: string;
  interests: string[];
  clubs: string[];
}
 
const YEARS     = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const BRANCHES  = ['CSE', 'ECE', 'Mechanical', 'Civil', 'IT', 'MBA', 'Other'];
const INTERESTS = ['Coding','Music','Sports','Art','Finance','Robotics','Gaming','Literature','Photography','Dance','Debate','Film-making'];
const CLUBS = [
  { name: 'Coding Club',              description: 'Competitive programming, open source & hackathons' },
  { name: 'Photography Club',         description: 'Weekly photo-walks, editing workshops, annual exhibition' },
  { name: 'Robotics Club',            description: 'Build bots, compete at state level' },
  { name: 'Entrepreneurship Cell',    description: 'Pitch nights, startup talks & mentor networking' },
  { name: 'AI and ML Society',        description: 'Machine learning projects and research' },
  { name: 'Cybersecurity Club',       description: 'CTF competitions and ethical hacking workshops' },
  { name: 'Music Club',               description: 'Jam sessions, performances and music production' },
  { name: 'Drama Society',            description: 'Theatre productions and improv sessions' },
];
 
const TOTAL_STEPS = 4;
 
export default function OnboardPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [step, setStep]               = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData]       = useState<FormData>({
    name: '', year: '', branch: '', interests: [], clubs: [],
  });
 
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);
 
  const canProceed = () => {
    if (step === 1) return formData.name.trim() !== '' && formData.year !== '';
    if (step === 2) return formData.branch !== '';
    if (step === 3) return formData.interests.length > 0;
    return true;
  };
 
  const toggleInterest = (v: string) =>
    setFormData(p => ({ ...p, interests: p.interests.includes(v) ? p.interests.filter(i => i !== v) : [...p.interests, v] }));
 
  const toggleClub = (v: string) =>
    setFormData(p => ({ ...p, clubs: p.clubs.includes(v) ? p.clubs.filter(c => c !== v) : [...p.clubs, v] }));
 
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const userId = (session?.user as any)?.id;
      if (!userId) { router.push('/login'); return; }
 
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId }),
      });
 
      if (!res.ok) {
        const err = await res.json();
        console.error('Onboard error:', err);
        throw new Error('Onboarding failed');
      }
 
      // Refresh session token so hasOnboarded becomes true
      await update({ hasOnboarded: true });
      router.push('/chat');
    } catch (error) {
      console.error('Onboard error:', error);
      alert('Something went wrong, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };
 
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-10">
      {/* Blue orb */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)' }} />
 
      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎓</div>
          <h1 className="text-white text-3xl font-bold">Set up your profile</h1>
          <p className="text-gray-500 text-sm mt-2">Tell us about yourself so CampusMind can personalise your experience</p>
        </div>
 
        {/* Card */}
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-500 text-xs">PROFILE SETUP</p>
              <p className="text-gray-500 text-xs">Step {step} of {TOTAL_STEPS}</p>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
                  style={{ background: i + 1 <= step ? 'linear-gradient(135deg, #2563eb, #06b6d4)' : '#222' }} />
              ))}
            </div>
          </div>
 
          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="min-h-[320px]"
            >
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-white text-xl font-semibold">Tell us about you</h2>
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Full Name</label>
                    <input type="text" placeholder="Your name"
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-black border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/60 transition-all" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Year</label>
                    <select value={formData.year}
                      onChange={e => setFormData(p => ({ ...p, year: e.target.value }))}
                      className="w-full bg-black border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-all appearance-none">
                      <option value="" disabled>Select your year</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              )}
 
              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-white text-xl font-semibold">Your department</h2>
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Branch</label>
                    <select value={formData.branch}
                      onChange={e => setFormData(p => ({ ...p, branch: e.target.value }))}
                      className="w-full bg-black border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-all appearance-none">
                      <option value="" disabled>Select your branch</option>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <p className="text-gray-600 text-xs">We'll tailor recommendations for your field</p>
                </div>
              )}
 
              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-white text-xl font-semibold">What are you into?</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {INTERESTS.map(interest => (
                      <button key={interest} onClick={() => toggleInterest(interest)}
                        className="rounded-xl border px-3 py-2.5 text-sm text-left transition-all"
                        style={{
                          background:   formData.interests.includes(interest) ? 'rgba(37,99,235,0.2)' : 'transparent',
                          borderColor:  formData.interests.includes(interest) ? 'rgba(37,99,235,0.6)' : 'rgba(255,255,255,0.08)',
                          color:        formData.interests.includes(interest) ? '#93c5fd' : '#888',
                        }}>
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              )}
 
              {/* Step 4 */}
              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-white text-xl font-semibold">Join some clubs</h2>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                    {CLUBS.map(club => (
                      <button key={club.name} onClick={() => toggleClub(club.name)}
                        className="w-full rounded-xl border p-4 text-left transition-all"
                        style={{
                          background:  formData.clubs.includes(club.name) ? 'rgba(37,99,235,0.15)' : 'transparent',
                          borderColor: formData.clubs.includes(club.name) ? 'rgba(37,99,235,0.5)'  : 'rgba(255,255,255,0.08)',
                        }}>
                        <p className="text-white text-sm font-medium">{club.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{club.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
 
          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)}
                className="text-gray-500 hover:text-white text-sm transition-colors px-4 py-2">
                ← Back
              </button>
            ) : <div />}
 
            {step < TOTAL_STEPS ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
                Next →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
                {isSubmitting ? 'Setting up...' : "Let's Go →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
