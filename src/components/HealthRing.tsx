'use client';

import React from 'react';

interface HealthRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function HealthRing({ score, size = 160, strokeWidth = 10 }: HealthRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return { stroke: '#34d399', glow: 'rgba(52, 211, 153, 0.3)', text: 'text-emerald-400', label: 'Healthy' };
    if (score >= 50) return { stroke: '#fbbf24', glow: 'rgba(251, 191, 36, 0.3)', text: 'text-amber-400', label: 'Warning' };
    return { stroke: '#f87171', glow: 'rgba(248, 113, 113, 0.3)', text: 'text-red-400', label: 'Critical' };
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="health-ring">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--t-ring-track)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 8px ${color.glow})`,
              transition: 'stroke-dashoffset 1s ease-in-out',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: 'rotate(0deg)' }}>
          <span className={`text-3xl font-bold ${color.text}`} style={{ fontFamily: 'var(--font-mono)' }}>
            {score}%
          </span>
          <span className="text-[10px] uppercase tracking-widest mt-1 t-text-dim">Health</span>
        </div>
      </div>
      <span className={`text-sm font-semibold ${color.text}`}>{color.label}</span>
    </div>
  );
}
