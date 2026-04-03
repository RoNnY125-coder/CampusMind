"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabaseAuth } from "@/components/SupabaseAuthProvider";
import { supabase } from "@/lib/supabase";
import { ensureStudentProfile } from "@/lib/auth-helpers";

interface FormData {
  name: string;
  year: string;
  branch: string;
  interests: string[];
  clubs: string[];
}

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const BRANCHES = ["CSE", "ECE", "Mechanical", "Civil", "IT", "MBA", "BCA", "MCA", "Other"];
const INTERESTS = [
  "Coding",
  "Music",
  "Sports",
  "Art",
  "Finance",
  "Robotics",
  "Gaming",
  "Literature",
  "Photography",
  "Dance",
  "Debate",
  "Film-making",
  "Design",
  "Research",
  "Entrepreneurship",
  "Travel",
];
const CLUBS = [
  { name: "Coding Club", description: "Competitive programming, open source and hackathon prep every Wednesday." },
  { name: "Photography Club", description: "Photo walks, editing workshops and annual showcase exhibitions." },
  { name: "Robotics Club", description: "Build autonomous bots and compete in inter-college events." },
  { name: "Entrepreneurship Cell", description: "Startup meetups, pitch nights and founder mentorship." },
  { name: "AI and ML Society", description: "ML projects, paper readings and Kaggle competitions together." },
  { name: "Cybersecurity Club", description: "CTF competitions, ethical hacking workshops and bug bounties." },
  { name: "Music Club", description: "Jam sessions, band formations and live campus performances." },
  { name: "Drama Society", description: "Theatre productions, improv sessions and street plays." },
  { name: "Literary Club", description: "Creative writing, poetry slams and book discussions." },
  { name: "Finance Club", description: "Stock market simulations, case studies and guest lectures." },
  { name: "Sports Committee", description: "Cricket, football, badminton and inter-college tournaments." },
  { name: "Design Studio", description: "UI/UX, graphic design, branding projects and design sprints." },
  { name: "NSS", description: "Community service, social impact projects and volunteering." },
  { name: "Cultural Committee", description: "Festivals, fests, talent shows and cultural exchange events." },
  { name: "Debate Club", description: "MUNs, parliamentary debates and public speaking workshops." },
  { name: "Film Society", description: "Screenings, film-making workshops and short film competitions." },
];

const TOTAL_STEPS = 4;

export default function OnboardPage() {
  const router = useRouter();
  const { user, session, loading, refreshSession } = useSupabaseAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    year: "",
    branch: "",
    interests: [],
    clubs: [],
  });

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      if (loading) return;

      console.log("[onboard] boot start");
      let activeSession = session;

      if (!activeSession?.access_token) {
        console.log("[onboard] no session in context, refreshing");
        activeSession = await refreshSession();
      }

      if (!activeSession?.access_token || !user) {
        console.log("[onboard] no active session, redirecting to login");
        router.replace("/login");
        return;
      }

      const results = await Promise.allSettled([
        ensureStudentProfile(activeSession.access_token),
        supabase
          .from("students")
          .select("name, year, branch, interests, clubs, has_onboarded")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (!mounted) return;

      const [ensureResult, profileResult] = results;

      if (ensureResult.status === "rejected" || (ensureResult.status === "fulfilled" && !ensureResult.value.ok)) {
        console.error("[onboard] ensure profile failed:", ensureResult);
        setInfo("We could not verify your profile yet. You can still continue.");
      }

      if (profileResult.status === "rejected") {
        console.error("[onboard] profile fetch crashed:", profileResult.reason);
        setInfo("We could not load your saved onboarding data. You can still continue.");
      } else if (profileResult.value.error) {
        console.error("[onboard] profile fetch failed:", profileResult.value.error.message);
        setInfo("We could not load your saved onboarding data. You can still continue.");
      } else if (profileResult.value.data) {
        const row = profileResult.value.data;
        console.log("[onboard] profile loaded", row);

        if (row.has_onboarded) {
          router.replace("/chat");
          return;
        }

        setFormData((prev) => ({
          ...prev,
          name: row.name ?? prev.name,
          year: row.year ?? prev.year,
          branch: row.branch ?? prev.branch,
          interests: Array.isArray(row.interests) ? row.interests : prev.interests,
          clubs: Array.isArray(row.clubs) ? row.clubs : prev.clubs,
        }));
      }

      console.log("[onboard] boot complete");
      setIsBooting(false);
    };

    void boot().catch((bootError) => {
      console.error("[onboard] boot fatal:", bootError);
      if (!mounted) return;
      setError("We could not initialize onboarding. Please refresh and try again.");
      setIsBooting(false);
    });

    return () => {
      mounted = false;
    };
  }, [loading, refreshSession, router, session, user]);

  const canProceed = () => {
    if (step === 1) return formData.name.trim() !== "" && formData.year !== "";
    if (step === 2) return formData.branch !== "";
    if (step === 3) return formData.interests.length > 0;
    return true;
  };

  const toggleInterest = (value: string) =>
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter((item) => item !== value)
        : [...prev.interests, value],
    }));

  const toggleClub = (value: string) =>
    setFormData((prev) => ({
      ...prev,
      clubs: prev.clubs.includes(value)
        ? prev.clubs.filter((item) => item !== value)
        : [...prev.clubs, value],
    }));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      let activeSession = session;
      if (!activeSession?.access_token) {
        console.log("[onboard] submit: refreshing session");
        activeSession = await refreshSession();
      }

      if (!activeSession?.access_token) {
        throw new Error("Your session is not ready yet. Please try again.");
      }

      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeSession.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Onboarding failed");
      }

      console.log("[onboard] submit complete");
      router.push("/chat");
    } catch (submitError) {
      console.error("[onboard] submit error:", submitError);
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isBooting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !session) {
    return null;
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #1e3a8a 75%, #0f172a 100%)" }}
    >
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full filter blur-3xl opacity-20 animate-pulse pointer-events-none" />
      <div
        className="absolute -bottom-32 -left-40 w-96 h-96 bg-indigo-600 rounded-full filter blur-3xl opacity-15 animate-pulse pointer-events-none"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold tracking-[0.2em] text-blue-400 uppercase mb-3"
          >
            CAMPUSMIND
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-white mb-2"
          >
            Set up your student profile
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-sm"
          >
            A few quick steps so CampusMind can personalise your experience.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs tracking-widest uppercase">Profile Setup</p>
            <p className="text-white text-sm font-semibold">
              Step <span className="text-blue-400">{step}</span> of {TOTAL_STEPS}
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <div
                key={index}
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{
                  background:
                    index + 1 <= step
                      ? "linear-gradient(135deg, #3b82f6, #06b6d4)"
                      : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-4 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-200">
              {info}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="min-h-[360px]"
            >
              {step === 1 && (
                <div className="space-y-5">
                  <h3 className="text-white text-xl font-semibold">Tell us about you</h3>
                  <div>
                    <label className="text-gray-300 text-sm block mb-2 font-medium">Full Name</label>
                    <input
                      type="text"
                      placeholder="Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/60 focus:bg-white/8 placeholder-gray-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm block mb-2 font-medium">Year</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/60 appearance-none transition-all"
                    >
                      <option value="" disabled className="bg-gray-900">
                        Select your year
                      </option>
                      {YEARS.map((year) => (
                        <option key={year} value={year} className="bg-gray-900">
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h3 className="text-white text-xl font-semibold">Your department</h3>
                  <div>
                    <label className="text-gray-300 text-sm block mb-2 font-medium">Branch</label>
                    <select
                      value={formData.branch}
                      onChange={(e) => setFormData((prev) => ({ ...prev, branch: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/60 appearance-none transition-all"
                    >
                      <option value="" disabled className="bg-gray-900">
                        Select your branch
                      </option>
                      {BRANCHES.map((branch) => (
                        <option key={branch} value={branch} className="bg-gray-900">
                          {branch}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-gray-500 text-xs">We&apos;ll tailor recommendations for your field.</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-white text-xl font-semibold">What are you into?</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className="rounded-xl border px-3 py-2.5 text-sm text-left transition-all hover:scale-105"
                        style={{
                          background: formData.interests.includes(interest)
                            ? "rgba(59,130,246,0.25)"
                            : "rgba(255,255,255,0.04)",
                          borderColor: formData.interests.includes(interest)
                            ? "rgba(59,130,246,0.7)"
                            : "rgba(255,255,255,0.1)",
                          color: formData.interests.includes(interest) ? "#93c5fd" : "#9ca3af",
                          boxShadow: formData.interests.includes(interest)
                            ? "0 0 12px rgba(59,130,246,0.2)"
                            : "none",
                        }}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white text-xl font-semibold">Clubs and communities</h3>
                    <span className="text-blue-400 text-xs">{formData.clubs.length} selected</span>
                  </div>
                  <p className="text-gray-500 text-xs -mt-2">A larger list, styled to match the rest of the app.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {CLUBS.map((club) => (
                      <button
                        key={club.name}
                        type="button"
                        onClick={() => toggleClub(club.name)}
                        className="rounded-xl border p-4 text-left transition-all hover:scale-[1.02]"
                        style={{
                          background: formData.clubs.includes(club.name)
                            ? "rgba(59,130,246,0.2)"
                            : "rgba(255,255,255,0.03)",
                          borderColor: formData.clubs.includes(club.name)
                            ? "rgba(59,130,246,0.6)"
                            : "rgba(255,255,255,0.1)",
                          boxShadow: formData.clubs.includes(club.name)
                            ? "0 0 16px rgba(59,130,246,0.15)"
                            : "none",
                        }}
                      >
                        <p className="font-medium text-sm text-white">{club.name}</p>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">{club.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => current - 1)}
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                disabled={!canProceed()}
                className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-30 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
              >
                {isSubmitting ? "Setting up..." : "Let's Go!"}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
