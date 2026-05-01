"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Brain, CalendarClock, Database, Lock, LogIn, Moon, Sparkles, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import ParticleField from "@/components/ParticleField";
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
  const [introOpen, setIntroOpen] = useState(false);

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
      <ParticleField active={introOpen} />

      <AnimatePresence>
        {!introOpen && (
          <motion.button
            type="button"
            aria-label="Open CampusMind"
            className="fixed inset-0 z-50 cursor-pointer border-0 bg-transparent p-0"
            onClick={() => setIntroOpen(true)}
            exit={{ pointerEvents: "none" }}
          >
            <motion.div
              className="absolute inset-x-0 top-0 h-1/2 bg-[#9b9b9b]"
              exit={{ y: "-103%" }}
              transition={{ duration: 0.92, ease: [0.76, 0, 0.24, 1] }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 h-1/2 bg-[#9b9b9b]"
              exit={{ y: "103%" }}
              transition={{ duration: 0.92, ease: [0.76, 0, 0.24, 1] }}
            />
            <motion.div
              className="intro-title-half intro-title-top"
              exit={{ y: "-58vh", opacity: 0 }}
              transition={{ duration: 0.82, ease: [0.76, 0, 0.24, 1] }}
            >
              <span>CAMPUS MIND</span>
            </motion.div>
            <motion.div
              className="intro-title-half intro-title-bottom"
              exit={{ y: "58vh", opacity: 0 }}
              transition={{ duration: 0.82, ease: [0.76, 0, 0.24, 1] }}
            >
              <span>CAMPUS MIND</span>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        className="screen-content flex min-h-screen flex-col"
        initial={false}
        animate={introOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.55, delay: introOpen ? 0.28 : 0 }}
      >
        <nav className="flex items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => setIntroOpen(true)}
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

        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-5 pb-8 pt-8 text-center sm:px-8 sm:pt-14">
          <motion.div
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-[var(--accent2)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={introOpen ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.45 }}
          >
            <Sparkles size={14} />
            AI Powered - Memory First - Campus Native
          </motion.div>

          <motion.h1
            className="max-w-4xl font-[var(--font-display)] text-[clamp(40px,7vw,76px)] font-extrabold leading-[1.05] text-[var(--pearl)]"
            initial={{ opacity: 0, y: 18 }}
            animate={introOpen ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.52, duration: 0.55 }}
          >
            Your Campus, Remembered
          </motion.h1>

          <motion.p
            className="mt-5 max-w-xl text-sm leading-7 text-[var(--text2)] sm:text-base"
            initial={{ opacity: 0, y: 18 }}
            animate={introOpen ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.55 }}
          >
            CampusMind is an AI assistant that keeps your profile, clubs, events, and goals in context so every answer feels made for your college life.
          </motion.p>

          <motion.button
            type="button"
            onClick={handleGetStarted}
            disabled={isBusy}
            className="btn btn-primary mt-8 !rounded-full !px-7 !py-3"
            initial={{ opacity: 0, y: 18 }}
            animate={introOpen ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.68, duration: 0.55 }}
          >
            {isBusy ? "Loading..." : "Explore Now"}
            <ArrowRight size={17} />
          </motion.button>

          <motion.div
            className="mt-11 h-px w-full max-w-xl bg-white/15"
            initial={{ opacity: 0, scaleX: 0.6 }}
            animate={introOpen ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ delay: 0.72, duration: 0.55 }}
          />

          <motion.section
            className="mt-9 w-full max-w-2xl"
            initial={{ opacity: 0, y: 18 }}
            animate={introOpen ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.78, duration: 0.55 }}
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
