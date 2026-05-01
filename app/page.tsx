"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Brain, CalendarClock, Database, Lock, LogIn, Moon, Sparkles, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

const features = [
  { icon: Brain, label: "AI-powered recommendations" },
  { icon: CalendarClock, label: "Personalized planner" },
  { icon: Database, label: "Real club data" },
  { icon: Lock, label: "Student memory vault" },
  { icon: Zap, label: "Super-fast replies" },
];

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  const handleGetStarted = async () => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      setIsCheckingUser(true);
      try {
        const { data } = await supabase
          .from("students")
          .select("has_onboarded")
          .eq("id", (session.user as any).id)
          .single();

        router.push(data?.has_onboarded ? "/chat" : "/onboard");
      } catch {
        router.push("/onboard");
      } finally {
        setIsCheckingUser(false);
      }
    }
  };

  const isBusy = status === "loading" || isCheckingUser;

  return (
    <div className="screen-shell">
      <div className="intro-overlay" aria-hidden="true">
        <div className="intro-panel intro-panel-top" />
        <div className="intro-panel intro-panel-bottom" />
        <div className="intro-title-half intro-title-top">
          <span>CAMPUS MIND</span>
        </div>
        <div className="intro-title-half intro-title-bottom">
          <span>CAMPUS MIND</span>
        </div>
      </div>

      <motion.div
        className="screen-content flex min-h-screen flex-col"
        initial={false}
      >
        <nav className="glass-navbar flex items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-3 border-0 bg-transparent text-left text-[15px] font-bold text-[var(--text)]"
          >
            <span className="brand-mark"><Moon size={15} className="text-[var(--accent2)]" /></span>
            <span className="font-[var(--font-display)]">CAMPUS MIND</span>
          </button>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => router.push("/login")} className="btn btn-ghost !rounded-full !px-4 !py-2">
              <LogIn size={15} />
              <span className="hidden sm:inline">Login</span>
            </button>
            <button type="button" onClick={() => router.push("/signup")} className="btn btn-primary !rounded-full !px-4 !py-2">
              Sign up
            </button>
          </div>
        </nav>

        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-5 pb-12 text-center sm:px-8">
          <section className="landing-hero flex w-full flex-col items-center justify-center">
            <motion.div
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-[var(--accent2)] backdrop-blur-xl"
              initial={false}
            >
              <Sparkles size={14} />
              AI Powered - Memory First - Campus Native
            </motion.div>

            <motion.h1
              className="max-w-4xl font-[var(--font-display)] text-[clamp(44px,8vw,86px)] font-extrabold leading-[1.04] text-[var(--pearl)]"
              initial={false}
            >
              Your Campus, Remembered
            </motion.h1>

            <motion.p
              className="mt-6 max-w-2xl text-sm leading-7 text-[var(--text2)] sm:text-base"
              initial={false}
            >
              CampusMind is an AI assistant that keeps your profile, clubs, events, and goals in context so every answer feels made for your college life.
            </motion.p>

            <motion.button
              type="button"
              onClick={handleGetStarted}
              disabled={isBusy}
              className="btn btn-primary mt-10 !rounded-full !px-8 !py-4"
              initial={false}
            >
              {isBusy ? "Loading..." : "Explore Now"}
              <ArrowRight size={17} />
            </motion.button>
          </section>

          <motion.section
            className="landing-features w-full max-w-3xl"
            initial={false}
          >
            <h2 className="mb-5 font-[var(--font-display)] text-2xl font-bold text-[var(--pearl)]">Features</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="landing-feature-card flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold">
                  <Icon size={16} className="text-[var(--accent2)]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.section>
        </main>
      </motion.div>
    </div>
  );
}
