'use client';

import React, { useState, useEffect } from 'react';
import { SensorData, FaultStatus, SystemStatus } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import SensorCard from './SensorCard';
import HealthRing from './HealthRing';
import { Wifi, Clock, Shield, AlertTriangle, WifiOff, Radio } from 'lucide-react';

interface DashboardPageProps {
  data: SensorData;
  faults: FaultStatus[];
  healthScore: number;
  globalStatus: SystemStatus;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  lastUpdated: Date | null;
  connectionStatus: 'connected' | 'lost' | 'reconnecting';
}

const sensorConfig = [
  { key: 'temperature', label: 'Temperature', unit: '°C' },
  { key: 'humidity', label: 'Humidity', unit: '%' },
  { key: 'gas_ppm', label: 'Gas Level', unit: 'PPM' },
  { key: 'current_a', label: 'Current', unit: 'A' },
  { key: 'voltage_v', label: 'Voltage', unit: 'V' },
  { key: 'oil_distance_cm', label: 'Oil Distance', unit: 'cm' },
  { key: 'vibration', label: 'Vibration', unit: 'g' },
];

const statusConfig = {
  healthy: {
    label: 'SYSTEM HEALTHY',
    bannerClass: 'system-banner-healthy',
    textColor: 'text-emerald-400',
    icon: Shield,
    description: 'All parameters within normal operating range',
  },
  warning: {
    label: 'SYSTEM WARNING',
    bannerClass: 'system-banner-warning',
    textColor: 'text-amber-400',
    icon: AlertTriangle,
    description: 'One or more parameters require attention',
  },
  critical: {
    label: 'SYSTEM CRITICAL',
    bannerClass: 'system-banner-critical',
    textColor: 'text-red-400',
    icon: AlertTriangle,
    description: 'Critical fault detected — immediate action required',
  },
};

export default function DashboardPage({
  data,
  faults,
  healthScore,
  globalStatus,
  autoRefresh,
  onToggleAutoRefresh,
  lastUpdated,
  connectionStatus,
}: DashboardPageProps) {
  const activeFaults = faults.filter((f) => f.status !== 'normal');
  const config = statusConfig[globalStatus];
  const StatusIcon = config.icon;

  // "Last updated X seconds ago" counter
  const [secondsAgo, setSecondsAgo] = useState(0);
  useEffect(() => {
    if (!lastUpdated) return;
    setSecondsAgo(0);
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  return (
    <div className="space-y-6 fade-in">
      {/* Global System Status Banner */}
      <div
        className={`rounded-2xl p-4 flex items-center gap-4 ${config.bannerClass}`}
        id="system-status-banner"
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            globalStatus === 'healthy'
              ? 'bg-emerald-500/10'
              : globalStatus === 'warning'
              ? 'bg-amber-500/10'
              : 'bg-red-500/10'
          }`}
        >
          <StatusIcon className={`w-6 h-6 ${config.textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${config.textColor}`}>
            {config.label}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
        </div>
        {activeFaults.length > 0 && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              globalStatus === 'critical'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {activeFaults.length} {activeFaults.length === 1 ? 'Issue' : 'Issues'}
          </span>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time sensor monitoring overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Data Indicator */}
          <div className="glass-card px-4 py-2.5 flex items-center gap-2.5 rounded-xl" id="live-indicator">
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 live-dot" />
                  <span className="text-xs font-semibold text-emerald-400">Live Data</span>
                </>
              ) : connectionStatus === 'reconnecting' ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 pulse-dot" />
                  <span className="text-xs font-semibold text-amber-400">Reconnecting...</span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400 connection-lost" />
                  <span className="text-xs font-semibold text-red-400">Connection Lost</span>
                </>
              )}
            </div>
            {lastUpdated && (
              <span className="text-[10px] text-slate-500 border-l border-slate-700 pl-2 ml-1">
                {secondsAgo < 5 ? 'Just now' : `${secondsAgo}s ago`}
              </span>
            )}
          </div>

          {/* Auto Refresh Toggle */}
          <div className="glass-card px-4 py-2.5 flex items-center gap-2.5 rounded-xl" id="auto-refresh-toggle">
            <Radio className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Auto Refresh</span>
            <button
              onClick={onToggleAutoRefresh}
              className={`toggle-track ${autoRefresh ? 'toggle-track-on' : 'toggle-track-off'}`}
              aria-label="Toggle auto refresh"
            >
              <span className={`toggle-thumb ${autoRefresh ? 'toggle-thumb-on' : 'toggle-thumb-off'}`} />
            </button>
            <span className={`text-[10px] font-bold ${autoRefresh ? 'text-emerald-400' : 'text-slate-500'}`}>
              {autoRefresh ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Device ID */}
          <div className="glass-card px-4 py-2.5 flex items-center gap-2.5 rounded-xl">
            <Shield className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Device</span>
              <span className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-mono)' }}>
                {data.device_id}
              </span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="glass-card px-4 py-2.5 flex items-center gap-2.5 rounded-xl">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Last Updated</span>
              <span className="text-xs font-medium text-slate-300">{formatTimestamp(data.timestamp)}</span>
            </div>
          </div>

          {/* Connection */}
          <div className="glass-card px-4 py-2.5 flex items-center gap-2.5 rounded-xl">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Status</span>
              <span
                className={`text-xs font-semibold ${
                  connectionStatus === 'connected'
                    ? 'text-emerald-400'
                    : connectionStatus === 'reconnecting'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {connectionStatus === 'connected'
                  ? 'Connected'
                  : connectionStatus === 'reconnecting'
                  ? 'Reconnecting'
                  : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sensor Cards Grid */}
        <div className="xl:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {sensorConfig.map((sensor, index) => (
              <div key={sensor.key} className="slide-up" style={{ animationDelay: `${index * 80}ms` }}>
                <SensorCard
                  label={sensor.label}
                  value={
                    sensor.key === 'vibration'
                      ? (data.vibration_magnitude ?? 0)
                      : (data[sensor.key as keyof SensorData] as number)
                  }
                  unit={sensor.unit}
                  sensorKey={sensor.key}
                  fault={faults.find((f) => f.sensor === sensor.key)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Health Score & Fault Panel */}
        <div className="space-y-4">
          {/* Health Score */}
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center" id="health-score-card">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">System Health</h3>
            <HealthRing score={healthScore} />
          </div>

          {/* Fault Panel */}
          <div className="glass-card p-5 rounded-2xl" id="fault-panel">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Diagnostics</h3>
            <div className="space-y-2">
              {faults.map((fault) => (
                <div
                  key={fault.sensor}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                    fault.status === 'critical'
                      ? 'bg-red-500/5 border border-red-500/10'
                      : fault.status === 'warning'
                      ? 'bg-amber-500/5 border border-amber-500/10'
                      : 'bg-slate-900/50'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      fault.status === 'critical'
                        ? 'bg-red-400'
                        : fault.status === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span className="text-xs text-slate-400 flex-1 truncate">
                    {fault.message}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      fault.status === 'critical'
                        ? 'text-red-400'
                        : fault.status === 'warning'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {fault.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
