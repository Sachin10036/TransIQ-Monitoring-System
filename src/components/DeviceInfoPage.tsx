'use client';

import React from 'react';
import { SensorData } from '@/lib/types';
import { formatTimestamp, getHealthStatus } from '@/lib/utils';
import HealthRing from './HealthRing';
import {
  Cpu,
  MapPin,
  Clock,
  Wifi,
  Server,
  HardDrive,
  Thermometer,
  Signal,
  Activity,
  ShieldCheck,
} from 'lucide-react';

interface DeviceInfoPageProps {
  data: SensorData;
  healthScore: number;
}

export default function DeviceInfoPage({ data, healthScore }: DeviceInfoPageProps) {
  const healthStatus = getHealthStatus(healthScore);

  const deviceDetails = [
    { icon: Cpu, label: 'Device ID', value: data.device_id, mono: true },
    { icon: Clock, label: 'Last Update', value: formatTimestamp(data.timestamp), mono: false },
    { icon: Wifi, label: 'Connection', value: 'Online — Stable', mono: false, status: 'emerald' },
    { icon: MapPin, label: 'Location', value: 'Industrial Zone A — Bay 3', mono: false },
    { icon: Server, label: 'Firmware', value: 'v4.2.1 (latest)', mono: true },
    { icon: HardDrive, label: 'Protocol', value: 'MQTT over TLS', mono: true },
    { icon: Signal, label: 'Signal Strength', value: '-42 dBm (Excellent)', mono: false },
    { icon: Activity, label: 'Uptime', value: '47d 13h 22m', mono: true },
  ];

  const specifications = [
    { label: 'Sensors', value: '7 Active Channels' },
    { label: 'Sampling Rate', value: '1 reading / 30s' },
    { label: 'Data Protocol', value: 'JSON over MQTT' },
    { label: 'Encryption', value: 'TLS 1.3 / AES-256' },
    { label: 'MCU', value: 'ESP32-S3 (240MHz)' },
    { label: 'Power Supply', value: 'DC 12V / 2A' },
    { label: 'Operating Temp', value: '-20°C to 85°C' },
    { label: 'IP Rating', value: 'IP65 (Dust/Water)' },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Cpu className="w-7 h-7 text-cyan-400" />
          Device Information
        </h1>
        <p className="text-sm text-slate-500 mt-1">Hardware details, connectivity, and system status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Status Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col items-center" id="device-status-card">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-4 border border-cyan-500/10">
            <Cpu className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
            {data.device_id}
          </h2>
          <p className="text-xs text-slate-500 mb-6">TransIQ IoT Sensor Node</p>

          <HealthRing score={healthScore} size={140} />

          <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-xs font-semibold text-emerald-400">System Online</span>
          </div>
        </div>

        {/* Device Details */}
        <div className="glass-card p-6 rounded-2xl" id="device-details">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Device Details
          </h3>
          <div className="space-y-3">
            {deviceDetails.map((detail) => {
              const Icon = detail.icon;
              return (
                <div
                  key={detail.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
                >
                  <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-xs text-slate-500 w-24 flex-shrink-0">{detail.label}</span>
                  <span
                    className={`text-xs font-medium flex-1 text-right ${
                      detail.status === 'emerald' ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                    style={detail.mono ? { fontFamily: 'var(--font-mono)' } : undefined}
                  >
                    {detail.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Specifications */}
        <div className="glass-card p-6 rounded-2xl" id="device-specs">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Specifications
          </h3>
          <div className="space-y-3">
            {specifications.map((spec) => (
              <div
                key={spec.label}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900/40"
              >
                <span className="text-xs text-slate-500">{spec.label}</span>
                <span className="text-xs font-medium text-slate-300" style={{ fontFamily: 'var(--font-mono)' }}>
                  {spec.value}
                </span>
              </div>
            ))}
          </div>

          {/* Current Sensor Readings Summary */}
          <div className="mt-5 pt-5 border-t border-slate-800/50">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Live Readings</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Temp', value: `${data.temperature}°C`, color: 'text-red-400' },
                { label: 'Humidity', value: `${data.humidity}%`, color: 'text-blue-400' },
                { label: 'Gas', value: `${data.gas_ppm} PPM`, color: 'text-violet-400' },
                { label: 'Current', value: `${data.current_a}A`, color: 'text-amber-400' },
                { label: 'Voltage', value: `${data.voltage_v}V`, color: 'text-cyan-400' },
                { label: 'Oil Dist', value: `${data.oil_distance_cm}cm`, color: 'text-emerald-400' },
              ].map((reading) => (
                <div key={reading.label} className="flex items-center justify-between px-2 py-1.5 rounded-md bg-slate-800/30">
                  <span className="text-[10px] text-slate-500">{reading.label}</span>
                  <span className={`text-xs font-semibold ${reading.color}`} style={{ fontFamily: 'var(--font-mono)' }}>
                    {reading.value}
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
