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
  const [introStarted, setIntroStarted] = useState(false);

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
  const introDelay = introStarted ? 0.92 : 0;

  return (
    <div className="screen-shell">
      <button
        type="button"
        className={`intro-overlay ${introStarted ? "is-started" : ""}`}
        onClick={() => setIntroStarted(true)}
        aria-label="Enter CampusMind"
        disabled={introStarted}
      >
        <div className="intro-panel intro-panel-top" />
        <div className="intro-panel intro-panel-bottom" />
        <div className="intro-title-half intro-title-top">
          <span>CAMPUS MIND</span>
        </div>
        <div className="intro-title-half intro-title-bottom">
          <span>CAMPUS MIND</span>
        </div>
        <span className="intro-enter">Click to enter</span>
      </button>

      <motion.div
        className="screen-content flex min-h-screen flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: introStarted ? 1 : 0 }}
        transition={{ delay: 0.52, duration: 0.55, ease: "easeOut" }}
      >
        <nav className="glass-navbar mx-auto mt-4 flex w-[calc(100%-32px)] max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="brand-button flex items-center gap-3 border-0 bg-transparent text-left text-[15px] font-bold text-[var(--text)]"
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

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-5 pb-0 text-center sm:px-8">
          <section className="landing-hero flex w-full flex-col items-center justify-center">
            <motion.div
              className="landing-kicker mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-[var(--accent2)] backdrop-blur-xl"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: introStarted ? 1 : 0, y: introStarted ? 0 : 18, scale: introStarted ? 1 : 0.96 }}
              transition={{ delay: introDelay + 0.1, duration: 0.55, ease: "easeOut" }}
            >
              <Sparkles size={14} />
              AI Powered - Memory First - Campus Native
            </motion.div>

            <motion.h1
              className="landing-title max-w-5xl font-[var(--font-display)] text-[clamp(58px,10vw,128px)] font-extrabold leading-[0.94] text-[var(--pearl)]"
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: introStarted ? 1 : 0, y: introStarted ? 0 : 30, filter: introStarted ? "blur(0px)" : "blur(10px)" }}
              transition={{ delay: introDelay + 0.18, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              Your Campus, Remembered
            </motion.h1>

            <motion.p
              className="mt-8 max-w-3xl text-base leading-8 text-[var(--text2)] sm:text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: introStarted ? 1 : 0, y: introStarted ? 0 : 20 }}
              transition={{ delay: introDelay + 0.32, duration: 0.55, ease: "easeOut" }}
            >
              CampusMind is an AI assistant that keeps your profile, clubs, events, and goals in context so every answer feels made for your college life.
            </motion.p>

            <motion.button
              type="button"
              onClick={handleGetStarted}
              disabled={isBusy}
              className="btn btn-primary mt-10 !rounded-full !px-8 !py-4"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: introStarted ? 1 : 0, y: introStarted ? 0 : 18 }}
              transition={{ delay: introDelay + 0.42, duration: 0.5, ease: "easeOut" }}
            >
              {isBusy ? "Loading..." : "Explore Now"}
              <ArrowRight size={17} />
            </motion.button>
          </section>

          <motion.section
            className="landing-features w-full max-w-5xl"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: introStarted ? 1 : 0, y: introStarted ? 0 : 26 }}
            transition={{ delay: introDelay + 0.58, duration: 0.65, ease: "easeOut" }}
          >
            <h2 className="mb-7 font-[var(--font-display)] text-4xl font-bold text-[var(--pearl)] sm:text-5xl">Features</h2>
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="landing-feature-card flex min-h-[132px] flex-col items-center justify-center gap-4 px-5 py-6 text-base font-semibold">
                  <span className="feature-icon-shell">
                    <Icon size={24} className="text-[var(--accent2)]" />
                  </span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.section>
        </main>

        <footer className="landing-footer screen-content">
          <div className="landing-footer-bar">
            <span className="font-[var(--font-display)] font-extrabold">CampusMind</span>
            <span className="footer-dot" aria-hidden="true" />
            <span>Developed by Raunak</span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
