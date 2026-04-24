"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

interface FormData {
  name: string;
  year: string;
  college: string;
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
  { name: "AIEM Club", description: "Advanced Intelligence in Electronics & Mechanics — interdisciplinary engineering blending electronics, mechanics, and AI." },
  { name: "AI Club", description: "Artificial Intelligence in healthcare, finance, automation, and robotics — workshops, industry collabs, AI projects." },
  { name: "Android Club", description: "Android app development and mobile technology — coding challenges, workshops, and real-world projects." },
  { name: "Anime Club", description: "Japanese animation, manga culture, and storytelling — screenings, discussions, and anime events." },
  { name: "ANTERIX Club", description: "Astronomy and space — stargazing sessions, workshops, and guest lectures by astronomers." },
  { name: "AWS Club", description: "Cloud computing with AWS — workshops, hackathons, and certification guidance for cloud careers." },
  { name: "Antique Arcade Club", description: "Historical architecture, heritage buildings, and antique structures — architectural tours and heritage workshops." },
  { name: "Bio-Engineering Club", description: "Intersection of engineering and life sciences — innovation at the bio-engineering frontier." },
  { name: "Blockchain Club", description: "Blockchain technology and decentralized apps — talks, workshops, and hackathons on Web3." },
  { name: "BashCraft Club", description: "Real-world CS and engineering — webinars with tech founders (Zerodha, Arpit Bhayani), 300+ participant events." },
  { name: "Cloud Zone", description: "Cloud platforms, deployment, and data management — hands-on workshops and cloud computing projects." },
  { name: "Coding Blocks (Bit By Bit)", description: "Competitive coding, web dev, and app creation — hackathons, workshops, and idea sharing." },
  { name: "D2C Igniters Club", description: "Competitions, hackathons, and quizzes — competitive events, mentorship, and domain workshops." },
  { name: "Data Science Club", description: "Big data, machine learning, and analytics — workshops, hands-on projects, and guest lectures." },
  { name: "E-Cell", description: "Entrepreneurship and startups — workshops, mentorship, startup pitches, and networking events." },
  { name: "Edu4U", description: "EdTech and ICT integration — discussions, workshops, and educational tool development." },
  { name: "E-Green Club", description: "Sustainable development and green technology — workshops, hackathons, and innovation challenges." },
  { name: "E-Commerce Club", description: "Online retail, digital marketing, and e-commerce entrepreneurship — workshops and industry insights." },
  { name: "Electric Vehicle Club", description: "Electric vehicles and clean energy — hands-on EV projects, workshops, and expert talks." },
  { name: "Eureka Club", description: "Research and academic papers — mentorship, paper writing, and publishing support with professors." },
  { name: "Feedbox College Club", description: "Skilled learning and connecting students to real-world challenges." },
  { name: "FYI Club", description: "Innovation, design thinking, and prototyping — ideation sessions and design workshops." },
  { name: "Freelancing Club", description: "Graphic design, content creation, web dev, and digital marketing — portfolio building and real projects." },
  { name: "GDG on Campus", description: "Google technologies — Flutter, TensorFlow, Firebase — workshops, hackathons, and expert talks." },
  { name: "Google Innovators Club", description: "Google Summer of Code prep, open-source development, and competitive coding on Codeforces." },
  { name: "Health Informatics Club", description: "Healthcare + IT — EHR, telemedicine, and healthcare analytics workshops." },
  { name: "iCreate Club", description: "Electronics, IoT projects, and hands-on making — build IoT solutions in the electronics workspace." },
  { name: "IoT Club", description: "Internet of Things, connected devices, and smart systems — hands-on projects and mentorship." },
  { name: "iOS Club", description: "iOS app development and the Apple ecosystem — workshops, coding challenges, and development." },
  { name: "LINPACK Club", description: "MATLAB programming and LaTeX document preparation — training for engineering and research workflows." },
  { name: "Linux Club", description: "Linux OS, open-source computing, shell scripting, and system administration." },
  { name: "Matrix – Multimedia Club", description: "Technocracy, innovation, and case studies — tech events and creative tech leadership." },
  { name: "MERN Stack Club", description: "Full-stack web development using MongoDB, Express, React, Node.js — live projects and hackathons." },
  { name: "Metaversity", description: "Metaverse, virtual worlds, and immersive technologies — exploring the next frontier of digital interaction." },
  { name: "Microsoft Technical Club", description: "Microsoft technologies — Azure, AI, enterprise tools — workshops, coding competitions, and Azure certifications." },
  { name: "Open-Source Club", description: "Open-source software development and contributions — collaborative community for OSS enthusiasts." },
  { name: "OWASP Club", description: "Web application security, cybersecurity, and ethical hacking — hands-on security projects." },
  { name: "PSI Society", description: "Scientific knowledge and science communication — seminars, outreach, and experiments." },
  { name: "Ramanuja Mathematica Club", description: "Mathematics, puzzles, theorems, and math competitions — problem-solving and number theory." },
  { name: "Robotics Club", description: "Robotics combining mechanical, electronics, and programming — hands-on robot building and competitions." },
  { name: "SAE India Collegiate Club", description: "Automotive and mobility engineering — vehicle design, fabrication, and SAE competitions." },
  { name: "Software Development Club", description: "Broad software engineering — web, mobile, various frameworks — coding challenges and hackathons." },
  { name: "Stats-O-Locked Club", description: "Statistics and data analysis — exploring the power of data through statistical methods." },
  { name: "Startup Club", description: "Startup ecosystem and entrepreneurship — mentorship, networking, and idea incubation." },
  { name: "TechnoMech Club", description: "Mechanical engineering co-curricular — MechaThon, Design Challenge, Tech Hackathon, and Plenary Talks." },
  { name: "The Finance Club", description: "Finance, stocks, crypto, and financial tools — stock market simulations and financial literacy events." },
  { name: "UX Club", description: "User Experience Design — crafting intuitive and meaningful digital experiences." },
  { name: "Virtual Reality & Gaming Club", description: "VR technology, game development, and gaming tournaments — VR workshops and game design sessions." },
  { name: "VITronix Club", description: "Electronics, robotics, and automation for social good — social-impact tech projects and outreach." },
  { name: "VIT Bhopal Cyber Warriors", description: "Cybersecurity, penetration testing, and digital security — CTF challenges and skill building." },
  { name: "Biz Whiz Club", description: "Business, entrepreneurship, marketing, finance, and strategy — workshops, guest lectures, and case studies." },
  { name: "Cognitive Fitness Club", description: "Brain health, mindfulness, mental well-being, and stress management — brain teasers and mindfulness sessions." },
  { name: "Cooking & Feasting Club", description: "Culinary arts, diverse cuisines, and cooking techniques — workshops, food tasting, and recipe exchanges." },
  { name: "Dance Club", description: "Contemporary, hip-hop, traditional, and cultural dance — workshops, performances, and dance-offs." },
  { name: "Defence Warriors Club", description: "Defence exam prep (CDS, AFCAT, INET, CAPF), SSB interviews, leadership, and self-defense training." },
  { name: "Ekfraseis Dramatics Society", description: "Theater, acting, and storytelling — workshops, rehearsals, and stage performances." },
  { name: "English Literary Club (ELA)", description: "English language, literature, fluency, and content creation — debates and social outreach events." },
  { name: "Fine Arts Club (Meraki)", description: "Visual arts, painting, crafts, and art exhibitions — workshops, competitions, and Diwali art events." },
  { name: "Fusion Club", description: "Event management — cultural festivals, sports, and entertainment on campus." },
  { name: "Insights Club", description: "Journalism, newsletters, and magazines — monthly newsletters, annual magazine, and media events." },
  { name: "MUN Club", description: "Model United Nations, global affairs, diplomacy, and debate — MUN simulations and policy discussions." },
  { name: "Music & Band Club", description: "Vocal and instrumental music — guitar, keyboard, bass, drums — performances and music showcases." },
  { name: "Nature & Trekking Club", description: "Outdoor adventures, trekking, and environmental conservation — treks, tree planting, and nature outings." },
  { name: "Photography & Movie Making Club", description: "Photography, filmmaking, and visual storytelling — film screenings, photo walks, and filmmaking workshops." },
  { name: "VIT Vista Voices", description: "Creativity, culture, and innovation — performances, competitions, and inter-college collaborations." },
  { name: "VITERA", description: "Literary and cultural club — celebrating language, literature, and creative expression." },
  { name: "VITKULT", description: "Art + Culture + Tech — dance, music, drama, hackathons, AI projects, and digital experiences blended together." },
  { name: "Andy Haryana Club", description: "Haryanvi culture, folk performances, and traditions — celebrating the heritage of Haryana." },
  { name: "Bengali Club", description: "Bengali culture, language, music, and festivals — for students from West Bengal." },
  { name: "Central India Club", description: "Madhya Pradesh culture, performing arts, crafts, and traditional cuisine." },
  { name: "Ganga Bhumi Club", description: "Heritage of UP, Bihar, and Jharkhand — folk arts, storytelling, and traditions." },
  { name: "Gujarati Club", description: "Gujarati culture, traditions, art, music, dance, and community service." },
  { name: "Hindi Club", description: "Hindi language, literature, poetry, debates, and cultural events." },
  { name: "Malayalam Club", description: "Kerala culture, Malayalam language, film, and music." },
  { name: "Maharo Rajasthan Club", description: "Rajasthani culture — Ghoomar, Rajasthan Day, literature, and sports." },
  { name: "Marathi Club", description: "Maharashtra culture, Marathi language, and traditions." },
  { name: "North East Club", description: "Culture of all 8 North Eastern states — language, art, music, and traditions." },
  { name: "Odia Club", description: "Odisha culture, festivals, dance, and traditions." },
  { name: "Punjabi Club", description: "Punjab culture, music nights, dance, and traditional celebrations." },
  { name: "Seedhe Pahad Se (Pahadi Club)", description: "Culture of Uttarakhand, Himachal Pradesh, and J&K — Himalayan heritage." },
  { name: "Tamil Club", description: "Tamil Nadu culture, Tamil language, literature, and poetry." },
  { name: "Telugu Club", description: "Telugu culture, language, cinema, and music." },
  { name: "VIT Bhopal ACM Chapter", description: "Computing research, coding, and technology — workshops, seminars, hackathons affiliated with ACM." },
  { name: "CSI Chapter", description: "Bridging academia and industry in CS — seminars, workshops, conferences, and project competitions." },
  { name: "GeeksForGeeks VITB Chapter", description: "Programming, CS learning, and peer collaboration — coding discussions and workshops." },
  { name: "IEEE Student Chapter", description: "Engineering and technology — collaboration, skill building, and leadership affiliated with IEEE." },
  { name: "Null Student Chapter", description: "Information security awareness and cybersecurity community affiliated with Null." },
  { name: "Omdena VIT Bhopal Chapter", description: "Real-world AI via open-source projects and AI education for local businesses." },
  { name: "SEDS Nebula", description: "Space exploration and development — interdisciplinary space projects and STEM outreach." },
  { name: "SIAM Student Chapter", description: "Applied mathematics — cryptography, CS, and forensics affiliated with SIAM." },
  { name: "TEDx VIT Bhopal", description: "Ideas worth sharing — speakers from diverse backgrounds and inspiring interdisciplinary talks." },
  { name: "Toastmasters International", description: "Public speaking, communication, and leadership — structured sessions, mentorship, and constructive feedback." },
  { name: "Material Advantage Chapter", description: "Materials science for Mechanical, Robotics, and Aerospace — affiliated with ASM, AIST, ACerS, TMS." },
  { name: "WiCyS", description: "Women in Cybersecurity — networking, knowledge sharing, and mentoring affiliated with WiCyS." },
  { name: "Google Developer Student Club (GDSC)", description: "Google technologies and developer ecosystem — workshops, hackathons, certifications, and networking." },
  { name: "Mozilla Firefox Club", description: "Open-source software, internet freedom, and Firefox advocacy — webinars and Mozilla project sessions." },
  { name: "Cisco Community", description: "Networking, technical and professional skills via Cisco partnership." },
];

const TOTAL_STEPS = 5;

export default function OnboardPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    year: "",
    college: "",
    branch: "",
    interests: [],
    clubs: [],
  });

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      console.log("[onboard] unauthenticated, redirecting to login");
      router.push("/login");
    }
  }, [status, router]);

  const canProceed = () => {
    if (step === 1) return formData.name.trim() !== "" && formData.year !== "";
    if (step === 2) return formData.college !== "";
    if (step === 3) return formData.branch !== "";
    if (step === 4) return formData.interests.length > 0;
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
      const userId = (session?.user as any)?.id;
      if (!userId) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userId }),
      });

      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Onboarding failed");
      }

      await update({ hasOnboarded: true });
      console.log("[onboard] submit complete");
      window.location.href = "/chat";
    } catch (submitError) {
      console.error("[onboard] submit error:", submitError);
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
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
                  <h3 className="text-white text-xl font-semibold">Where do you study?</h3>
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, college: "VIT Bhopal" }))}
                      className="w-full rounded-xl border p-4 text-left transition-all hover:scale-[1.02]"
                      style={{
                        background: formData.college === "VIT Bhopal" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
                        borderColor: formData.college === "VIT Bhopal" ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.1)",
                        boxShadow: formData.college === "VIT Bhopal" ? "0 0 16px rgba(59,130,246,0.15)" : "none",
                      }}
                    >
                      <p className="font-semibold text-white">VIT Bhopal University</p>
                      <p className="text-gray-400 text-xs mt-1">Vellore Institute of Technology, Bhopal Campus</p>
                    </button>
                    
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl border border-white/5 bg-white/5 p-4 text-left opacity-40 cursor-not-allowed"
                    >
                      <p className="font-semibold text-gray-300">SRM Institute of Science and Technology</p>
                      <p className="text-gray-500 text-xs mt-1">More colleges coming soon...</p>
                    </button>

                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl border border-white/5 bg-white/5 p-4 text-left opacity-40 cursor-not-allowed"
                    >
                      <p className="font-semibold text-gray-300">BITS Pilani</p>
                      <p className="text-gray-500 text-xs mt-1">More colleges coming soon...</p>
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
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

              {step === 4 && (
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

              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white text-xl font-semibold">Clubs and communities</h3>
                    <span className="text-blue-400 text-xs font-semibold px-2 py-1 bg-blue-500/10 rounded-full">{formData.clubs.length} selected</span>
                  </div>
                  <p className="text-gray-400 text-sm">Select the clubs you are a part of, or interested in joining.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {CLUBS.map((club) => (
                      <button
                        key={club.name}
                        type="button"
                        onClick={() => toggleClub(club.name)}
                        className="rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
                        style={{
                          background: formData.clubs.includes(club.name)
                            ? "rgba(59,130,246,0.15)"
                            : "rgba(255,255,255,0.05)",
                          borderColor: formData.clubs.includes(club.name)
                            ? "rgba(59,130,246,0.6)"
                            : "rgba(255,255,255,0.1)",
                          boxShadow: formData.clubs.includes(club.name)
                            ? "0 4px 20px rgba(59,130,246,0.2)"
                            : "none",
                        }}
                      >
                        <p className={formData.clubs.includes(club.name) ? "font-semibold text-blue-300" : "font-medium text-white"}>
                          {club.name}
                        </p>
                        <p className={formData.clubs.includes(club.name) ? "text-blue-100 text-xs mt-1.5 leading-relaxed" : "text-gray-300 text-xs mt-1.5 leading-relaxed"}>
                          {club.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/10">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => current - 1)}
                className="text-gray-300 hover:text-white text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
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
                className="text-white text-sm font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-30 hover:opacity-90 shadow-lg hover:shadow-blue-500/25"
                style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)" }}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="text-white text-sm font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50 hover:opacity-90 shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)" }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Let's Go!"
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

