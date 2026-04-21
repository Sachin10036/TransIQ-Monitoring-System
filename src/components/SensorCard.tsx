'use client';

import React from 'react';
import { FaultStatus } from '@/lib/types';
import {
  Thermometer,
  Droplets,
  Wind,
  Zap,
  Gauge,
  Fuel,
  Activity,
} from 'lucide-react';

interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  sensorKey: string;
  fault: FaultStatus | undefined;
}

const iconMap: Record<string, React.ElementType> = {
  temperature: Thermometer,
  humidity: Droplets,
  gas_ppm: Wind,
  current_a: Zap,
  voltage_v: Gauge,
  oil_distance_cm: Fuel,
  vibration: Activity,
};

const colorMap: Record<string, { gradient: string; iconBg: string; iconColor: string }> = {
  temperature: {
    gradient: 'from-red-500/10 to-orange-500/5',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
  },
  humidity: {
    gradient: 'from-blue-500/10 to-cyan-500/5',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
  },
  gas_ppm: {
    gradient: 'from-violet-500/10 to-purple-500/5',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
  },
  current_a: {
    gradient: 'from-amber-500/10 to-yellow-500/5',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
  },
  voltage_v: {
    gradient: 'from-cyan-500/10 to-teal-500/5',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
  },
  oil_distance_cm: {
    gradient: 'from-emerald-500/10 to-green-500/5',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
  },
  vibration: {
    gradient: 'from-orange-500/10 to-amber-500/5',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-400',
  },
};

export default function SensorCard({ label, value, unit, sensorKey, fault }: SensorCardProps) {
  const Icon = iconMap[sensorKey] || Activity;
  const colors = colorMap[sensorKey] || colorMap.temperature;
  const status = fault?.status || 'normal';

  const statusClasses =
    status === 'critical'
      ? 'sensor-card-critical'
      : status === 'warning'
      ? 'sensor-card-warning'
      : 'sensor-card-normal';

  const statusDot =
    status === 'critical'
      ? 'bg-red-400'
      : status === 'warning'
      ? 'bg-amber-400'
      : 'bg-emerald-400';

  const statusLabel =
    status === 'critical'
      ? 'Critical'
      : status === 'warning'
      ? 'Warning'
      : 'Normal';

  // For vibration, show magnitude as a float; for others, show raw value
  const displayValue =
    sensorKey === 'vibration' ? value.toFixed(2) : value.toString();

  return (
    <div
      className={`glass-card ${statusClasses} p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02]`}
      id={`sensor-card-${sensorKey}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.iconColor}`} />
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${statusDot} ${status !== 'normal' ? 'pulse-dot' : ''}`} />
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              status === 'critical' ? 'text-red-400' : status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="mb-1">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-2xl font-bold transition-colors duration-300 ${
            status === 'critical'
              ? 'text-red-400'
              : status === 'warning'
              ? 'text-amber-400'
              : 'text-white'
          }`}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {displayValue}
        </span>
        <span className="text-sm text-slate-500">{unit}</span>
      </div>

      {fault && fault.status !== 'normal' && (
        <div className="mt-3 pt-3 border-t border-slate-800/50">
          <p className="text-[11px] text-slate-400 leading-relaxed">{fault.message}</p>
        </div>
      )}
    </div>
  );
}
