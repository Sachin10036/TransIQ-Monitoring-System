'use client';

import React from 'react';
import { Prediction } from '@/lib/types';
import {
  Droplets,
  Thermometer,
  Zap,
  Activity,
  Wind,
  BrainCircuit,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface PredictionsPageProps {
  predictions: Prediction[];
}

const iconMap: Record<string, React.ElementType> = {
  droplet: Droplets,
  thermometer: Thermometer,
  zap: Zap,
  activity: Activity,
  wind: Wind,
};

const riskConfig = {
  low: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-400',
    icon: ShieldCheck,
    label: 'Low Risk',
  },
  medium: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-400',
    icon: AlertTriangle,
    label: 'Medium Risk',
  },
  high: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    badge: 'bg-red-500/10 text-red-400',
    icon: ShieldAlert,
    label: 'High Risk',
  },
};

export default function PredictionsPage({ predictions }: PredictionsPageProps) {
  const highRisk = predictions.filter((p) => p.riskLevel === 'high').length;
  const mediumRisk = predictions.filter((p) => p.riskLevel === 'medium').length;
  const lowRisk = predictions.filter((p) => p.riskLevel === 'low').length;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BrainCircuit className="w-7 h-7 text-cyan-400" />
            Predictive Analysis
          </h1>
          <p className="text-sm text-slate-500 mt-1">AI-powered trend analysis and early warning system</p>
        </div>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-red-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">High Risk</span>
              <p className="text-2xl font-bold text-red-400" style={{ fontFamily: 'var(--font-mono)' }}>
                {highRisk}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Medium Risk</span>
              <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: 'var(--font-mono)' }}>
                {mediumRisk}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Low Risk</span>
              <p className="text-2xl font-bold text-emerald-400" style={{ fontFamily: 'var(--font-mono)' }}>
                {lowRisk}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Predictions List */}
      {predictions.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <ShieldCheck className="w-16 h-16 text-emerald-400/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">All Systems Clear</h3>
          <p className="text-sm text-slate-500">
            No predictive warnings at this time. All sensor trends are within expected parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction, index) => {
            const risk = riskConfig[prediction.riskLevel];
            const Icon = iconMap[prediction.icon] || Activity;
            const RiskIcon = risk.icon;

            return (
              <div
                key={prediction.id}
                className={`glass-card p-6 rounded-2xl border ${risk.border} slide-up`}
                style={{ animationDelay: `${index * 100}ms` }}
                id={`prediction-${prediction.id}`}
              >
                <div className="flex items-start gap-5">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${risk.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${risk.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-white">{prediction.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${risk.badge}`}>
                        {risk.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">{prediction.message}</p>

                    {/* Warning Indicator */}
                    <div className="flex items-center gap-2">
                      <RiskIcon className={`w-4 h-4 ${risk.color}`} />
                      <span className={`text-xs font-medium ${risk.color}`}>
                        {prediction.riskLevel === 'high'
                          ? 'Immediate attention recommended'
                          : prediction.riskLevel === 'medium'
                          ? 'Monitor closely over next 24 hours'
                          : 'Continue routine monitoring'}
                      </span>
                    </div>
                  </div>

                  {/* Risk Meter */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-8 h-24 rounded-full bg-slate-800/80 relative overflow-hidden">
                      <div
                        className={`absolute bottom-0 w-full rounded-full transition-all duration-500 ${
                          prediction.riskLevel === 'high'
                            ? 'bg-gradient-to-t from-red-500 to-red-400 h-full'
                            : prediction.riskLevel === 'medium'
                            ? 'bg-gradient-to-t from-amber-500 to-amber-400 h-2/3'
                            : 'bg-gradient-to-t from-emerald-500 to-emerald-400 h-1/3'
                        }`}
                        style={{
                          boxShadow:
                            prediction.riskLevel === 'high'
                              ? '0 0 15px rgba(248,113,113,0.4)'
                              : prediction.riskLevel === 'medium'
                              ? '0 0 15px rgba(251,191,36,0.4)'
                              : '0 0 15px rgba(52,211,153,0.4)',
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-600 uppercase">Risk</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
