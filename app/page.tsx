"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
    const router = useRouter();

    return (
        <div className="bg-gray-950 min-h-screen flex items-center justify-center px-4">
            <div className="flex flex-col items-center gap-6 text-center">
                <span className="text-7xl">🎓</span>
                <h1 className="text-white text-4xl font-bold">CampusMind</h1>
                <p className="text-gray-400 text-lg max-w-sm">
                    Your AI campus assistant that remembers you
                </p>
                <button
                    onClick={() => router.push("/onboard")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-lg font-medium transition-colors"
                >
                    Get Started →
                </button>
            </div>
        </div>
    );
}
