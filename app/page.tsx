"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LandingPage() {
    const router = useRouter();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className="relative w-full min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-hidden">
            {/* Animated gradient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-4000"></div>
            </div>

            {/* Mouse follower glow */}
            <div
                className="fixed w-96 h-96 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full filter blur-3xl opacity-0 pointer-events-none transition-opacity duration-300"
                style={{
                    left: `${mousePosition.x - 192}px`,
                    top: `${mousePosition.y - 192}px`,
                    opacity: isHovered ? 0.15 : 0,
                }}
            ></div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
                {/* Floating cards background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Floating card 1 */}
                    <div className="absolute top-20 right-10 w-64 h-40 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-md border border-purple-400/20 rounded-2xl transform -rotate-12 animate-float opacity-60 hover:opacity-100 transition-opacity"></div>
                    
                    {/* Floating card 2 */}
                    <div className="absolute bottom-32 left-10 w-72 h-48 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-md border border-blue-400/20 rounded-2xl transform rotate-12 animate-float animation-delay-2000 opacity-60 hover:opacity-100 transition-opacity"></div>
                    
                    {/* Floating card 3 */}
                    <div className="absolute top-1/3 right-1/4 w-56 h-32 bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-md border border-pink-400/20 rounded-2xl transform -rotate-6 animate-float animation-delay-4000 opacity-40 hover:opacity-100 transition-opacity"></div>
                </div>

                {/* Main content */}
                <div className="flex flex-col items-center gap-8 text-center max-w-2xl animate-fade-in">
                    {/* Icon with glow */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full filter blur-2xl opacity-60 animate-pulse"></div>
                        <div className="relative text-8xl drop-shadow-2xl animate-bounce-slow">🎓</div>
                    </div>

                    {/* Title with gradient */}
                    <div className="space-y-4">
                        <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-lg animate-fade-in-delay-1">
                            CampusMind
                        </h1>
                        <div className="h-1 w-32 mx-auto bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full animate-pulse"></div>
                    </div>

                    {/* Description */}
                    <p className="text-lg md:text-xl text-gray-300 max-w-lg leading-relaxed animate-fade-in-delay-2">
                        Meet your <span className="text-purple-300 font-semibold">AI-powered campus companion</span> that learns, remembers, and grows with you. Experience intelligence that understands your journey.
                    </p>

                    {/* Stats cards */}
                    <div className="grid grid-cols-3 gap-4 my-6 w-full max-w-md">
                        <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-lg border border-purple-400/30 rounded-xl p-4 hover:from-purple-500/40 hover:to-indigo-500/40 transition-all duration-300 transform hover:scale-110 animate-fade-in-delay-3">
                            <div className="text-2xl font-bold text-purple-300">24/7</div>
                            <div className="text-xs text-gray-400">Available</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-lg border border-blue-400/30 rounded-xl p-4 hover:from-blue-500/40 hover:to-cyan-500/40 transition-all duration-300 transform hover:scale-110 animate-fade-in-delay-4">
                            <div className="text-2xl font-bold text-blue-300">∞</div>
                            <div className="text-xs text-gray-400">Memory</div>
                        </div>
                        <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 backdrop-blur-lg border border-pink-400/30 rounded-xl p-4 hover:from-pink-500/40 hover:to-rose-500/40 transition-all duration-300 transform hover:scale-110 animate-fade-in-delay-5">
                            <div className="text-2xl font-bold text-pink-300">AI</div>
                            <div className="text-xs text-gray-400">Powered</div>
                        </div>
                    </div>

                    {/* CTA Button with floating effect */}
                    <button
                        onClick={() => router.push("/onboard")}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className="relative mt-8 group animate-fade-in-delay-6"
                    >
                        {/* Button glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                        
                        {/* Button */}
                        <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white px-10 py-4 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-110 hover:shadow-2xl cursor-pointer flex items-center gap-3 group-hover:gap-4">
                            <span>Get Started</span>
                            <span className="text-xl transform group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                    </button>

                    {/* Floating features */}
                    <div className="mt-16 text-sm text-gray-400 animate-fade-in-delay-7">
                        ✨ Join thousands of students already using CampusMind
                    </div>
                </div>

                {/* Animated background elements */}
                <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
            </div>

            {/* Global animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    50% {
                        transform: translateY(-20px) rotate(2deg);
                    }
                }

                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }

                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }

                .animate-fade-in-delay-1 {
                    animation: fade-in 0.6s ease-out 0.1s forwards;
                    opacity: 0;
                }

                .animate-fade-in-delay-2 {
                    animation: fade-in 0.6s ease-out 0.2s forwards;
                    opacity: 0;
                }

                .animate-fade-in-delay-3 {
                    animation: fade-in 0.6s ease-out 0.3s forwards;
                    opacity: 0;
                }

                .animate-fade-in-delay-4 {
                    animation: fade-in 0.6s ease-out 0.4s forwards;
                    opacity: 0;
                }

                .animate-fade-in-delay-5 {
                    animation: fade-in 0.6s ease-out 0.5s forwards;
                    opacity: 0;
                }

                .animate-fade-in-delay-6 {
                    animation: fade-in 0.6s ease-out 0.6s forwards;
                    opacity: 0;
                }

                .animate-fade-in-delay-7 {
                    animation: fade-in 0.6s ease-out 0.7s forwards;
                    opacity: 0;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }

                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}
