"use client";

import { useEffect, useRef } from "react";

type ParticleFieldProps = {
  active?: boolean;
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  baseY: number;
  speed: number;
  radius: number;
  alpha: number;
  phase: number;
  band: number;
};

export default function ParticleField({ active = true, className = "" }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let raf = 0;
    let particles: Particle[] = [];
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);

    const createParticles = () => {
      const density = width < 720 ? 72 : 150;
      const centerY = height * 0.48;
      const spread = Math.max(160, height * 0.36);

      particles = Array.from({ length: density }, (_, index) => {
        const band = index % 8;
        const baseY = centerY + (band - 3.5) * (spread / 8) + (Math.random() - 0.5) * 28;

        return {
          x: Math.random() * width,
          y: baseY,
          baseY,
          speed: 0.52 + Math.random() * 0.74,
          radius: 0.8 + Math.random() * 1.8,
          alpha: 0.26 + Math.random() * 0.58,
          phase: Math.random() * Math.PI * 2,
          band,
        };
      });
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      createParticles();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const sinkX = width * 0.1;
      const sinkY = height * 0.48;

      for (const particle of particles) {
        particle.phase += 0.016;
        particle.x -= reduceMotion ? 0 : particle.speed;

        const progress = Math.max(0, Math.min(1, 1 - particle.x / width));
        const pull = progress * progress;
        const wave = Math.sin(particle.phase + particle.x * 0.018) * (18 + particle.band * 2);
        particle.y = particle.baseY + wave - (particle.baseY - sinkY) * pull * 0.72;

        if (particle.x < -48 || Math.hypot(particle.x - sinkX, particle.y - sinkY) < 22) {
          particle.x = width + Math.random() * 220;
          particle.baseY = height * (0.22 + Math.random() * 0.56);
          particle.phase = Math.random() * Math.PI * 2;
        }

        const dx = particle.x - sinkX;
        const dy = particle.y - sinkY;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const swirl = Math.atan2(dy, dx) + progress * 1.9;
        const drawX = progress > 0.7 ? sinkX + Math.cos(swirl) * distance * (1 - (progress - 0.7) * 0.55) : particle.x;
        const drawY = progress > 0.7 ? sinkY + Math.sin(swirl) * distance * (1 - (progress - 0.7) * 0.55) : particle.y;
        const alpha = particle.alpha * (0.55 + pull * 0.55);

        context.beginPath();
        context.fillStyle = `rgba(255,255,255,${alpha})`;
        context.shadowColor = "rgba(255,255,255,0.55)";
        context.shadowBlur = 9;
        context.arc(drawX, drawY, particle.radius * (1 + pull * 0.5), 0, Math.PI * 2);
        context.fill();
      }

      context.shadowBlur = 0;
      const gradient = context.createRadialGradient(sinkX, sinkY, 2, sinkX, sinkY, 110);
      gradient.addColorStop(0, "rgba(0,0,0,0.9)");
      gradient.addColorStop(0.36, "rgba(0,0,0,0.55)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(sinkX, sinkY, 112, 0, Math.PI * 2);
      context.fill();

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [active]);

  if (!active) return null;

  return <canvas ref={canvasRef} className={`particle-field ${className}`} aria-hidden="true" />;
}
