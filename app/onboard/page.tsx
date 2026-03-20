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

    const animateTransition = useCallback(
        (newStep: number, dir: "forward" | "back") => {
            setDirection(dir);
            setIsAnimating(true);

            // Slide current step out
            setSlideClass(
                dir === "forward"
                    ? "-translate-x-full opacity-0"
                    : "translate-x-full opacity-0"
            );

            setTimeout(() => {
                setStep(newStep);
                // Position new step off-screen on the opposite side
                setSlideClass(
                    dir === "forward"
                        ? "translate-x-full opacity-0"
                        : "-translate-x-full opacity-0"
                );

                // Trigger reflow then animate in
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
        <div className="bg-gray-950 min-h-screen flex items-center justify-center px-4">
            <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                {/* ── Progress Indicator ────────────────────────────────── */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all duration-300 ${i + 1 === step
                                    ? "w-8 bg-indigo-600"
                                    : i + 1 < step
                                        ? "w-8 bg-indigo-400"
                                        : "w-8 bg-gray-700"
                                }`}
                        />
                    ))}
                </div>
                <p className="text-gray-500 text-xs text-center mb-6">
                    Step {step} of {TOTAL_STEPS}
                </p>

                {/* ── Step Content (Animated) ──────────────────────────── */}
                <div className="overflow-hidden">
                    <div
                        className={`transform transition-all duration-300 ease-in-out ${slideClass}`}
                    >
                        {/* Step 1 — Tell us about you */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <h2 className="text-white text-xl font-bold">
                                    Tell us about you ✌️
                                </h2>
                                <div>
                                    <label className="text-gray-400 text-sm block mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Rahul Sharma"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                                        }
                                        className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm block mb-1">
                                        Year
                                    </label>
                                    <select
                                        value={formData.year}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, year: e.target.value }))
                                        }
                                        className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
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
                            <div className="space-y-5">
                                <h2 className="text-white text-xl font-bold">
                                    Your department 🏛️
                                </h2>
                                <div>
                                    <label className="text-gray-400 text-sm block mb-1">
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
                                        className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
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
                                <p className="text-gray-500 text-xs">
                                    We&apos;ll tailor recommendations for your field
                                </p>
                            </div>
                        )}

                        {/* Step 3 — What are you into? */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <h2 className="text-white text-xl font-bold">
                                    What are you into? 🎯
                                </h2>
                                <div className="grid grid-cols-2 gap-2">
                                    {INTERESTS.map((interest) => (
                                        <button
                                            key={interest}
                                            onClick={() => toggleInterest(interest)}
                                            className={`rounded-xl border p-3 cursor-pointer text-sm text-left transition-all ${formData.interests.includes(interest)
                                                    ? "border-indigo-500 bg-indigo-900/30 text-indigo-300"
                                                    : "border-gray-700 text-gray-300 hover:border-gray-600"
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
                            <div className="space-y-5">
                                <h2 className="text-white text-xl font-bold">
                                    Join some clubs 🚀
                                </h2>
                                <div className="space-y-3">
                                    {CLUBS.map((club) => (
                                        <button
                                            key={club.name}
                                            onClick={() => toggleClub(club.name)}
                                            className={`w-full rounded-xl border p-4 cursor-pointer text-left transition-all ${formData.clubs.includes(club.name)
                                                    ? "border-indigo-500 bg-indigo-900/30"
                                                    : "border-gray-700 hover:border-gray-600"
                                                }`}
                                        >
                                            <p
                                                className={`font-medium text-sm ${formData.clubs.includes(club.name)
                                                        ? "text-indigo-300"
                                                        : "text-white"
                                                    }`}
                                            >
                                                {club.name}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-1">
                                                {club.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Navigation Buttons ───────────────────────────────── */}
                <div className="flex items-center justify-between mt-8">
                    {step > 1 ? (
                        <button
                            onClick={handleBack}
                            disabled={isAnimating}
                            className="text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-40"
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
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors"
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || isAnimating}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors"
                        >
                            {isSubmitting ? "Setting up..." : "🚀 Let's Go!"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
