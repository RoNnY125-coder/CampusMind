"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface FormData {
    name: string;
    year: string;
    branch: string;
    interests: string[];
    clubs: string[];
}

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const BRANCHES = ["CSE", "ECE", "Mechanical", "Civil", "IT", "MBA", "Other"];
const INTERESTS = [
    "Coding", "Music", "Sports", "Art",
    "Finance", "Robotics", "Gaming", "Literature",
    "Photography", "Dance", "Debate", "Film-making",
];
const CLUBS: { name: string; description: string }[] = [
    { name: "Coding Club", description: "Competitive programming, open source & hackathons every Wednesday" },
    { name: "Photography Club", description: "Weekly photo-walks, equipment provided, annual exhibition" },
    { name: "Robotics Club", description: "Build bots, compete at state level, Tue & Thu sessions" },
    { name: "Entrepreneurship Cell (E-Cell)", description: "Pitch nights, startup talks & mentor networking every Monday" },
];

const TOTAL_STEPS = 4;

export default function OnboardPage() {
    const router = useRouter();

    const [step, setStep] = useState<number>(1);
    const [formData, setFormData] = useState<FormData>({
        name: "",
        year: "",
        branch: "",
        interests: [],
        clubs: [],
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [direction, setDirection] = useState<"forward" | "back">("forward");
    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const [slideClass, setSlideClass] = useState<string>("translate-x-0 opacity-100");
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const animateTransition = useCallback(
        (newStep: number, dir: "forward" | "back") => {
            setDirection(dir);
            setIsAnimating(true);

            setSlideClass(
                dir === "forward"
                    ? "-translate-x-full opacity-0"
                    : "translate-x-full opacity-0"
            );

            setTimeout(() => {
                setStep(newStep);
                setSlideClass(
                    dir === "forward"
                        ? "translate-x-full opacity-0"
                        : "-translate-x-full opacity-0"
                );

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setSlideClass("translate-x-0 opacity-100");
                        setTimeout(() => setIsAnimating(false), 300);
                    });
                });
            }, 250);
        },
        []
    );

    const canProceed = (): boolean => {
        switch (step) {
            case 1:
                return formData.name.trim() !== "" && formData.year !== "";
            case 2:
                return formData.branch !== "";
            case 3:
                return formData.interests.length > 0;
            case 4:
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (step < TOTAL_STEPS && canProceed() && !isAnimating) {
            animateTransition(step + 1, "forward");
        }
    };

    const handleBack = () => {
        if (step > 1 && !isAnimating) {
            animateTransition(step - 1, "back");
        }
    };

    const toggleInterest = (interest: string) => {
        setFormData((prev) => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter((i) => i !== interest)
                : [...prev.interests, interest],
        }));
    };

    const toggleClub = (club: string) => {
        setFormData((prev) => ({
            ...prev,
            clubs: prev.clubs.includes(club)
                ? prev.clubs.filter((c) => c !== club)
                : [...prev.clubs, club],
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            let userId = localStorage.getItem("campusmind_userId");
            if (!userId) {
                userId = crypto.randomUUID();
                localStorage.setItem("campusmind_userId", userId);
            }

            const res = await fetch("/api/onboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, userId }),
            });

            if (!res.ok) throw new Error("Onboarding failed");

            router.push("/chat?userId=" + userId);
        } catch (error) {
            console.error("Onboard error:", error);
            alert("Something went wrong, please try again");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div 
            className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
            style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #2d1b69 50%, #1e3a8a 75%, #0f172a 100%)",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(2deg); }
                }
                @keyframes float-reverse {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(20px) rotate(-2deg); }
                }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-float-reverse { animation: float-reverse 7s ease-in-out infinite; }
                .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
                .animate-fade-in { animation: fade-in-up 0.6s ease-out forwards; }
            `}</style>

            {/* Animated Background Orbs */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-glow"></div>
            <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse-glow" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-glow" style={{animationDelay: '2s'}}></div>

            {/* Mouse Follower Glow */}
            <div
                className="fixed w-96 h-96 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full filter blur-3xl opacity-0 pointer-events-none transition-opacity duration-300"
                style={{
                    left: `${mousePosition.x - 192}px`,
                    top: `${mousePosition.y - 192}px`,
                    opacity: isHovered ? 0.1 : 0,
                }}
            ></div>

            {/* Floating Accent Cards */}
            <div className="absolute top-20 right-10 w-64 h-40 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-md border border-purple-400/20 rounded-2xl transform -rotate-12 animate-float opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-32 left-8 w-52 h-48 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 backdrop-blur-md border border-indigo-400/20 rounded-2xl transform rotate-12 animate-float-reverse opacity-30 pointer-events-none"></div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-in" style={{animationDelay: '0.1s'}}>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent mb-2">
                        Welcome to CampusMind
                    </h1>
                    <p className="text-gray-400">Let's get to know you better</p>
                </div>

                {/* Card Container */}
                <div 
                    className="relative rounded-3xl backdrop-blur-xl border border-purple-500/20 bg-gradient-to-br from-slate-900/80 to-purple-900/40 p-8 shadow-2xl animate-fade-in"
                    style={{animationDelay: '0.2s'}}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/0 via-indigo-600/0 to-blue-600/0 opacity-0 transition-opacity duration-300" style={{opacity: isHovered ? 0.1 : 0}}></div>

                    <div className="relative z-10">
                        {/* Progress Indicator */}
                        <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in" style={{animationDelay: '0.3s'}}>
                            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2.5 rounded-full transition-all duration-500 ${i + 1 === step
                                            ? "w-10 bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/50"
                                            : i + 1 < step
                                                ? "w-8 bg-indigo-500/60"
                                                : "w-6 bg-gray-700/50"
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-gray-400 text-xs text-center mb-8 animate-fade-in" style={{animationDelay: '0.4s'}}>
                            Step <span className="font-bold text-purple-400">{step}</span> of <span className="font-bold text-indigo-400">{TOTAL_STEPS}</span>
                        </p>

                        {/* Step Content (Animated) */}
                        <div className="overflow-hidden">
                            <div
                                className={`transform transition-all duration-300 ease-in-out ${slideClass}`}
                            >
                                {/* Step 1 — Tell us about you */}
                                {step === 1 && (
                                    <div className="space-y-5 animate-fade-in">
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                                            Tell us about you ✌️
                                        </h2>
                                        <div>
                                            <label className="text-gray-300 text-sm block mb-2 font-medium">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Rahul Sharma"
                                                value={formData.name}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                                                }
                                                className="w-full bg-purple-900/20 border border-purple-500/30 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500/60 focus:shadow-lg focus:shadow-purple-500/20 placeholder-gray-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-gray-300 text-sm block mb-2 font-medium">
                                                Year
                                            </label>
                                            <select
                                                value={formData.year}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({ ...prev, year: e.target.value }))
                                                }
                                                className="w-full bg-purple-900/20 border border-purple-500/30 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500/60 focus:shadow-lg focus:shadow-purple-500/20 appearance-none transition-all"
                                            >
                                                <option value="" disabled>
                                                    Select your year
                                                </option>
                                                {YEARS.map((y) => (
                                                    <option key={y} value={y}>
                                                        {y}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2 — Your department */}
                                {step === 2 && (
                                    <div className="space-y-5 animate-fade-in">
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                                            Your department 🏛️
                                        </h2>
                                        <div>
                                            <label className="text-gray-300 text-sm block mb-2 font-medium">
                                                Branch
                                            </label>
                                            <select
                                                value={formData.branch}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        branch: e.target.value,
                                                    }))
                                                }
                                                className="w-full bg-purple-900/20 border border-purple-500/30 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500/60 focus:shadow-lg focus:shadow-purple-500/20 appearance-none transition-all"
                                            >
                                                <option value="" disabled>
                                                    Select your branch
                                                </option>
                                                {BRANCHES.map((b) => (
                                                    <option key={b} value={b}>
                                                        {b}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-gray-400 text-xs">
                                            ✨ We'll tailor recommendations for your field
                                        </p>
                                    </div>
                                )}

                                {/* Step 3 — What are you into? */}
                                {step === 3 && (
                                    <div className="space-y-5 animate-fade-in">
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                                            What are you into? 🎯
                                        </h2>
                                        <div className="grid grid-cols-2 gap-3">
                                            {INTERESTS.map((interest) => (
                                                <button
                                                    key={interest}
                                                    onClick={() => toggleInterest(interest)}
                                                    className={`rounded-xl border p-3 cursor-pointer text-sm text-left transition-all transform hover:scale-105 ${formData.interests.includes(interest)
                                                            ? "border-purple-500/60 bg-purple-900/40 text-purple-200 shadow-lg shadow-purple-500/30"
                                                            : "border-purple-500/20 text-gray-400 hover:border-purple-500/40 bg-purple-900/10"
                                                        }`}
                                                >
                                                    {interest}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 4 — Join some clubs */}
                                {step === 4 && (
                                    <div className="space-y-5 animate-fade-in">
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                                            Join some clubs 🚀
                                        </h2>
                                        <div className="space-y-3">
                                            {CLUBS.map((club) => (
                                                <button
                                                    key={club.name}
                                                    onClick={() => toggleClub(club.name)}
                                                    className={`w-full rounded-xl border p-4 cursor-pointer text-left transition-all transform hover:scale-105 ${formData.clubs.includes(club.name)
                                                            ? "border-purple-500/60 bg-purple-900/40 shadow-lg shadow-purple-500/30"
                                                            : "border-purple-500/20 hover:border-purple-500/40 bg-purple-900/10"
                                                        }`}
                                                >
                                                    <p
                                                        className={`font-medium text-sm ${formData.clubs.includes(club.name)
                                                                ? "text-purple-200"
                                                                : "text-white"
                                                            }`}
                                                    >
                                                        {club.name}
                                                    </p>
                                                    <p className="text-gray-400 text-xs mt-1">
                                                        {club.description}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-10 gap-4">
                            {step > 1 ? (
                                <button
                                    onClick={handleBack}
                                    disabled={isAnimating}
                                    className="text-gray-300 hover:text-white text-sm font-medium transition-colors disabled:opacity-40 hover:bg-purple-900/30 px-4 py-2 rounded-lg"
                                >
                                    ← Back
                                </button>
                            ) : (
                                <div />
                            )}

                            {step < TOTAL_STEPS ? (
                                <button
                                    onClick={handleNext}
                                    disabled={!canProceed() || isAnimating}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:shadow-none"
                                >
                                    Next →
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isAnimating}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:shadow-none"
                                >
                                    {isSubmitting ? "Setting up..." : "🚀 Let's Go!"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
