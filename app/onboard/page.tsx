"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
const BRANCHES = ["CSE", "ECE", "Mechanical", "Civil", "IT", "MBA", "BBA", "Biotech", "Other"];
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
];
const CLUBS: { name: string; description: string }[] = [
  { name: "Coding Club", description: "Competitive programming, open source and hackathon prep." },
  { name: "Photography Club", description: "Photo walks, editing workshops and annual showcases." },
  { name: "Robotics Club", description: "Build autonomous bots and compete in inter-college events." },
  { name: "Entrepreneurship Cell", description: "Startup meetups, pitch nights and founder mentorship." },
  { name: "AI and ML Society", description: "Model building, paper reading groups and mini projects." },
  { name: "Cybersecurity Club", description: "CTFs, ethical hacking basics and security labs." },
  { name: "Debate Society", description: "Public speaking, debate practice and competition coaching." },
  { name: "Dramatics Club", description: "Stage productions, improv nights and auditions each semester." },
  { name: "Music Club", description: "Band jams, vocals, instrument circles and event performances." },
  { name: "Dance Crew", description: "Choreography practice for cultural fests and campus showcases." },
  { name: "Quiz Club", description: "Weekly quizzes, current affairs and tournament preparation." },
  { name: "Literary Club", description: "Poetry, creative writing sessions and editorial collaborations." },
  { name: "Design Club", description: "UI, posters, branding and visual storytelling projects." },
  { name: "Film and Media Club", description: "Short films, script writing and production workshops." },
  { name: "Gaming and Esports Club", description: "Casual scrims, tournaments and streaming events." },
  { name: "NSS Volunteer Cell", description: "Community service drives, awareness campaigns and field work." },
  { name: "Eco Club", description: "Sustainability projects, campus cleanups and green campaigns." },
  { name: "Finance and Investment Club", description: "Markets, case studies and investing fundamentals." },
];

const TOTAL_STEPS = 4;

import { useSession } from "next-auth/react";

export default function OnboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (status === "unauthenticated") {
        router.push("/login");
    }
  }, [status, router]);

  const canProceed = () => {
    if (step === 1) return formData.name.trim() !== "" && formData.year !== "";
    if (step === 2) return formData.branch !== "";
    if (step === 3) return formData.interests.length > 0;
    return true;
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((item) => item !== interest)
        : [...prev.interests, interest],
    }));
  };

  const toggleClub = (club: string) => {
    setFormData((prev) => ({
      ...prev,
      clubs: prev.clubs.includes(club)
        ? prev.clubs.filter((item) => item !== club)
        : [...prev.clubs, club],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      if (!session) {
        throw new Error("Your session is not ready yet. Please try again.");
      }

      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData }),
      });

      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Onboarding failed. Please try again.");
      }

      console.log("[onboard] submit complete");
      router.push("/chat");
    } catch (err) {
      console.error("[onboard] submit:", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-blue-300">CampusMind</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Set up your student profile</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-400 sm:text-base">
            A cleaner setup flow with the same black, white and blue look as the auth pages.
          </p>
        </header>

        <div className="glass glow-blue overflow-hidden rounded-[28px] border border-white/10">
          <div className="bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_35%)] px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Profile Setup</p>
                <h2 className="mt-2 text-xl font-semibold sm:text-2xl">Step {step} of {TOTAL_STEPS}</h2>
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index + 1 === step
                        ? "w-10 bg-gradient-to-r from-blue-500 to-cyan-400"
                        : index + 1 < step
                        ? "w-7 bg-blue-500/50"
                        : "w-7 bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}
            {info && (
              <p className="mt-5 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                {info}
              </p>
            )}

            <div className="mt-8 min-h-[420px]">
              {step === 1 && (
                <section className="animate-fade-up">
                  <h3 className="text-2xl font-semibold">Basic details</h3>
                  <p className="mt-2 text-sm text-gray-400">Keep it simple and professional.</p>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-200">Full name</span>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Rahul Sharma"
                        className="w-full rounded-2xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-500 hover:border-blue-500/30 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-200">Year</span>
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition-all hover:border-blue-500/30 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="" disabled>
                          Select your year
                        </option>
                        {YEARS.map((year) => (
                          <option key={year} value={year} className="bg-gray-950 text-white">
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>
              )}

              {step === 2 && (
                <section className="animate-fade-up">
                  <h3 className="text-2xl font-semibold">Academic profile</h3>
                  <p className="mt-2 text-sm text-gray-400">We use this to tailor events and recommendations.</p>

                  <div className="mt-6 max-w-xl">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-200">Branch</span>
                      <select
                        value={formData.branch}
                        onChange={(e) => setFormData((prev) => ({ ...prev, branch: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition-all hover:border-blue-500/30 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="" disabled>
                          Select your branch
                        </option>
                        {BRANCHES.map((branch) => (
                          <option key={branch} value={branch} className="bg-gray-950 text-white">
                            {branch}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>
              )}

              {step === 3 && (
                <section className="animate-fade-up">
                  <h3 className="text-2xl font-semibold">Interests</h3>
                  <p className="mt-2 text-sm text-gray-400">Pick a few so the assistant feels more useful from day one.</p>

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {INTERESTS.map((interest) => {
                      const active = formData.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            active
                              ? "border-blue-500/40 bg-blue-500/15 text-blue-100"
                              : "border-white/10 bg-gray-900 text-gray-300 hover:border-blue-500/30 hover:bg-gray-800"
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {step === 4 && (
                <section className="animate-fade-up">
                  <h3 className="text-2xl font-semibold">Clubs and communities</h3>
                  <p className="mt-2 text-sm text-gray-400">A larger list, styled to match the rest of the app.</p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {CLUBS.map((club) => {
                      const active = formData.clubs.includes(club.name);
                      return (
                        <button
                          key={club.name}
                          type="button"
                          onClick={() => toggleClub(club.name)}
                          className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            active
                              ? "border-blue-500/40 bg-blue-500/12 shadow-[0_0_24px_rgba(37,99,235,0.14)]"
                              : "border-white/10 bg-gray-900 hover:border-blue-500/30 hover:bg-gray-800"
                          }`}
                        >
                          <p className={`text-sm font-semibold ${active ? "text-blue-100" : "text-white"}`}>
                            {club.name}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-gray-400">{club.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            <footer className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition-all ${
                  step === 1
                    ? "cursor-not-allowed border-white/10 text-gray-600"
                    : "border-white/10 text-gray-300 hover:border-blue-500/30 hover:text-white"
                }`}
                disabled={step === 1}
              >
                Back
              </button>

              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => prev + 1)}
                  disabled={!canProceed()}
                  className="rounded-xl bg-[linear-gradient(135deg,#2563eb,#06b6d4)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(37,99,235,0.25)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-xl bg-[linear-gradient(135deg,#2563eb,#06b6d4)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(37,99,235,0.25)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? "Setting up..." : "Finish setup"}
                </button>
              )}
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}
