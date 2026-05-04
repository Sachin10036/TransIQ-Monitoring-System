'use client';

import React, { useState } from 'react';
import { Prediction, SensorData, ImmediateAction } from '@/lib/types';
import { getImmediateActions, mapActionTypeToPredictionSensor } from '@/lib/utils';
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
  Wrench,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Flame,
  PlugZap,
  Gauge,
  Waves,
} from 'lucide-react';

interface PredictionsPageProps {
  predictions: Prediction[];
  sensorData: SensorData | null;
}

const iconMap: Record<string, React.ElementType> = {
  droplet: Droplets,
  thermometer: Thermometer,
  zap: Zap,
  activity: Activity,
  wind: Wind,
};

const actionTypeIcon: Record<string, React.ElementType> = {
  temperature: Flame,
  voltage: PlugZap,
  gas: Wind,
  vibration: Waves,
  current: Gauge,
  humidity: Droplets,
};

const actionTypeLabel: Record<string, string> = {
  temperature: 'Temperature',
  voltage: 'Voltage',
  gas: 'Gas (MQ2)',
  vibration: 'Vibration',
  current: 'Current',
  humidity: 'Humidity',
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

const levelStyleMap = {
  WARNING: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-400',
    glow: 'rgba(251, 191, 36, 0.08)',
  },
  CRITICAL: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    badge: 'bg-red-500/10 text-red-400',
    glow: 'rgba(248, 113, 113, 0.08)',
  },
  NORMAL: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-400',
    glow: 'rgba(52, 211, 153, 0.08)',
  },
};

/* ── Inline Action Card (shown inside a prediction card) ──────────────── */
function InlineActionPanel({ action }: { action: ImmediateAction }) {
  const style = levelStyleMap[action.level];

  return (
    <div
      className="mt-4 rounded-xl border p-4 action-panel-animate"
      style={{
        borderColor: action.level === 'CRITICAL' ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)',
        background: style.glow,
      }}
    >
      {/* Immediate Actions */}
      <div className="flex items-center gap-2 mb-2.5">
        <Wrench className={`w-3.5 h-3.5 ${style.color}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${style.color}`}>
          Immediate Actions
        </span>
      </div>
      <ul className="space-y-1.5 mb-3 pl-1">
        {action.actions.map((a, i) => (
          <li key={i} className="flex items-start gap-2 text-sm t-text-secondary">
            <span
              className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                action.level === 'CRITICAL' ? 'bg-red-400' : 'bg-amber-400'
              }`}
            />
            {a}
          </li>
        ))}
      </ul>

      {/* Why this matters */}
      <div className="flex items-start gap-2 pt-2.5" style={{ borderTop: '1px solid rgba(100,116,139,0.1)' }}>
        <CircleAlert className="w-3.5 h-3.5 mt-0.5 t-text-dim flex-shrink-0" />
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider t-text-dim block mb-0.5">
            Why this matters
          </span>
          <p className="text-xs leading-relaxed t-text-muted">{action.reason}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Standalone Action Card (for actions without prediction cards) ─────── */
function StandaloneActionCard({ action, index }: { action: ImmediateAction; index: number }) {
  const style = levelStyleMap[action.level];
  const Icon = actionTypeIcon[action.type] || Activity;

  return (
    <div
      className={`glass-card p-6 rounded-2xl border ${style.border} slide-up`}
      style={{ animationDelay: `${index * 100}ms` }}
      id={`action-${action.type}`}
    >
      <div className="flex items-start gap-5">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${style.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-base font-semibold t-text-primary">
              {actionTypeLabel[action.type] || action.type}
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${style.badge}`}>
              {action.level}
            </span>
          </div>

          {/* Actions list */}
          <div className="flex items-center gap-2 mb-2">
            <Wrench className={`w-3.5 h-3.5 ${style.color}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${style.color}`}>
              Immediate Actions
            </span>
          </div>
          <ul className="space-y-1.5 mb-3 pl-1">
            {action.actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm t-text-secondary">
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    action.level === 'CRITICAL' ? 'bg-red-400' : 'bg-amber-400'
                  }`}
                />
                {a}
              </li>
            ))}
          </ul>

          {/* Why */}
          <div className="flex items-start gap-2 pt-2.5" style={{ borderTop: '1px solid rgba(100,116,139,0.1)' }}>
            <CircleAlert className="w-3.5 h-3.5 mt-0.5 t-text-dim flex-shrink-0" />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider t-text-dim block mb-0.5">
                Why this matters
              </span>
              <p className="text-xs leading-relaxed t-text-muted">{action.reason}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PredictionsPage({ predictions, sensorData }: PredictionsPageProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const highRisk = predictions.filter((p) => p.riskLevel === 'high').length;
  const mediumRisk = predictions.filter((p) => p.riskLevel === 'medium').length;
  const lowRisk = predictions.filter((p) => p.riskLevel === 'low').length;

  // Generate immediate actions from current sensor data
  const immediateActions: ImmediateAction[] = sensorData ? getImmediateActions(sensorData) : [];

  // Create a lookup: prediction sensor → matching action
  const actionBySensor = new Map<string, ImmediateAction>();
  immediateActions.forEach((a) => {
    const sensorKey = mapActionTypeToPredictionSensor(a.type);
    actionBySensor.set(sensorKey, a);
  });

  // Find actions that DON'T map to any existing prediction card
  const predictedSensors = new Set(predictions.map((p) => p.sensor));
  const standaloneActions = immediateActions.filter(
    (a) => !predictedSensors.has(mapActionTypeToPredictionSensor(a.type))
  );

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalActions = immediateActions.length;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 t-text-primary">
            <BrainCircuit className="w-7 h-7 text-cyan-400" />
            Predictive Analysis
          </h1>
          <p className="text-sm mt-1 t-text-dim">AI-powered trend analysis and early warning system</p>
        </div>
        {totalActions > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/15">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">
              {totalActions} Active Recommendation{totalActions !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-red-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider t-text-dim">High Risk</span>
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
              <span className="text-[10px] uppercase tracking-wider t-text-dim">Medium Risk</span>
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
              <span className="text-[10px] uppercase tracking-wider t-text-dim">Low Risk</span>
              <p className="text-2xl font-bold text-emerald-400" style={{ fontFamily: 'var(--font-mono)' }}>
                {lowRisk}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Predictions List */}
      {predictions.length === 0 && standaloneActions.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <ShieldCheck className="w-16 h-16 text-emerald-400/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 t-text-primary">All Systems Clear</h3>
          <p className="text-sm t-text-dim">
            No predictive warnings at this time. All sensor trends are within expected parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction, index) => {
            const risk = riskConfig[prediction.riskLevel];
            const Icon = iconMap[prediction.icon] || Activity;
            const RiskIcon = risk.icon;
            const matchingAction = actionBySensor.get(prediction.sensor);
            const isExpanded = expandedCards.has(prediction.id);
            const hasAction = !!matchingAction;

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
                      <h3 className="text-base font-semibold t-text-primary">{prediction.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${risk.badge}`}>
                        {risk.label}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed mb-3 t-text-muted">{prediction.message}</p>

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

                    {/* Action Toggle Button */}
                    {hasAction && (
                      <button
                        onClick={() => toggleCard(prediction.id)}
                        className="action-toggle-btn mt-3"
                        id={`toggle-action-${prediction.id}`}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Hide' : 'View'} Recommendations</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Inline Action Panel */}
                    {hasAction && isExpanded && matchingAction && (
                      <InlineActionPanel action={matchingAction} />
                    )}
                  </div>

                  {/* Risk Meter */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-8 h-24 rounded-full relative overflow-hidden" style={{ background: 'var(--t-input-bg)' }}>
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
                    <span className="text-[9px] uppercase t-text-faint">Risk</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Standalone Action Cards (no matching prediction) */}
          {standaloneActions.length > 0 && (
            <>
              <div className="flex items-center gap-3 mt-8 mb-2">
                <div className="h-px flex-1" style={{ background: 'var(--t-border)' }} />
                <div className="flex items-center gap-2 px-3 py-1">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider t-text-dim">
                    Additional Recommendations
                  </span>
                </div>
                <div className="h-px flex-1" style={{ background: 'var(--t-border)' }} />
              </div>
              <p className="text-xs t-text-dim mb-3">
                These sensors are currently outside optimal range but have no predicted trend risk yet.
              </p>
              {standaloneActions.map((action, index) => (
                <StandaloneActionCard key={action.type} action={action} index={index} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
