'use client';

import React, { useState, useMemo } from 'react';
import { HistoricalDataPoint } from '@/lib/types';
import { getStats, calculateTrend, thresholdConfig } from '@/lib/utils';
import { useTheme } from './ThemeProvider';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface AnalyticsPageProps {
  historicalData: Record<string, HistoricalDataPoint[]>;
  realtimeBuffer?: HistoricalDataPoint[];
}

const chartConfigs = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#f87171', glowColor: 'rgba(248,113,113,0.5)', gradientId: 'tempGrad', glowId: 'tempGlow' },
  { key: 'voltage_v', label: 'Voltage', unit: 'V', color: '#22d3ee', glowColor: 'rgba(34,211,238,0.5)', gradientId: 'voltGrad', glowId: 'voltGlow' },
  { key: 'current_a', label: 'Current', unit: 'A', color: '#fbbf24', glowColor: 'rgba(251,191,36,0.5)', gradientId: 'currGrad', glowId: 'currGlow' },
  { key: 'gas_ppm', label: 'Gas Level', unit: 'PPM', color: '#a78bfa', glowColor: 'rgba(167,139,250,0.5)', gradientId: 'gasGrad', glowId: 'gasGlow' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#60a5fa', glowColor: 'rgba(96,165,250,0.5)', gradientId: 'humGrad', glowId: 'humGlow' },
  { key: 'vibration', label: 'Vibration', unit: 'g', color: '#fb923c', glowColor: 'rgba(251,146,60,0.5)', gradientId: 'vibGrad', glowId: 'vibGlow' },
];

const timeFilters = [
  { key: 'realtime', label: 'Real-time' },
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

function formatChartTime(ts: string, filter: string): string {
  const d = new Date(ts);
  if (filter === 'realtime' || filter === 'day') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  if (filter === 'week') return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Premium Tooltip with theme-aware styling ────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: 'var(--t-tooltip-bg)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--t-tooltip-border)',
        borderRadius: '14px',
        padding: '12px 16px',
        boxShadow: 'var(--t-tooltip-shadow)',
        minWidth: '160px',
      }}
    >
      <p style={{ fontSize: '10px', color: 'var(--t-text-dim)', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </p>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < payload.length - 1 ? '4px' : 0 }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: entry.color,
              boxShadow: `0 0 6px ${entry.color}`,
            }}
          />
          <span style={{ fontSize: '12px', color: 'var(--t-text-secondary)' }}>
            {entry.name}:{' '}
            <strong style={{ color: entry.color, fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </strong>
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Custom Active Dot with glow ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GlowActiveDot(props: any) {
  const { cx, cy, stroke } = props;
  if (cx === undefined || cy === undefined) return null;
  return (
    <g>
      {/* Outer glow */}
      <circle cx={cx} cy={cy} r={12} fill={stroke} fillOpacity={0.15} />
      {/* Mid ring */}
      <circle cx={cx} cy={cy} r={8} fill={stroke} fillOpacity={0.25} />
      {/* Core dot */}
      <circle cx={cx} cy={cy} r={4} fill="var(--t-bg)" stroke={stroke} strokeWidth={2.5} />
    </g>
  );
}

// ── Crosshair Cursor ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomCursor(props: any) {
  const { points, height } = props;
  if (!points || !points.length) return null;
  const { x } = points[0];
  return (
    <line
      x1={x}
      y1={0}
      x2={x}
      y2={height}
      stroke="rgba(34, 211, 238, 0.3)"
      strokeWidth={1}
      strokeDasharray="4 3"
    />
  );
}

export default function AnalyticsPage({ historicalData, realtimeBuffer = [] }: AnalyticsPageProps) {
  const [timeFilter, setTimeFilter] = useState('realtime');
  const { theme } = useTheme();

  const data = useMemo(() => {
    let raw: HistoricalDataPoint[];

    if (timeFilter === 'realtime') {
      raw = realtimeBuffer.slice(-20);
    } else {
      raw = historicalData[timeFilter] || [];
    }

    return raw.map((d) => ({
      ...d,
      time: formatChartTime(d.timestamp, timeFilter),
    }));
  }, [historicalData, realtimeBuffer, timeFilter]);

  const chartGridColor = theme === 'light' ? 'rgba(100,116,139,0.06)' : 'rgba(100,116,139,0.08)';
  const chartAxisColor = theme === 'light' ? 'rgba(100,116,139,0.15)' : 'rgba(100,116,139,0.12)';
  const chartTickColor = theme === 'light' ? '#64748B' : '#475569';

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold t-text-primary">Analytics</h1>
          <p className="text-sm mt-1 t-text-dim">
            {timeFilter === 'realtime' ? 'Live data stream (last 20 readings)' : 'Historical trends and statistical analysis'}
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--t-input-bg)', border: '1px solid var(--t-border)' }} id="time-filter-tabs">
          {timeFilters.map((f) => (
            <button
              key={f.key}
              id={`filter-${f.key}`}
              onClick={() => setTimeFilter(f.key)}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                timeFilter === f.key
                  ? f.key === 'realtime'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'border border-transparent'
              }`}
              style={timeFilter !== f.key ? { color: 'var(--t-text-dim)' } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {chartConfigs.map((config) => {
          const dataKey = config.key as keyof HistoricalDataPoint;
          const values = data
            .map((d) => d[dataKey] as number)
            .filter((v) => v !== undefined && v !== null);
          const stats = getStats(values);
          const trend = calculateTrend(values);
          const thresholds = thresholdConfig[config.key];

          return (
            <div key={config.key} className="glass-card p-5 rounded-2xl" id={`chart-${config.key}`}>
              {/* Chart Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color, boxShadow: `0 0 8px ${config.glowColor}` }} />
                    <h3 className="text-sm font-semibold t-text-primary">{config.label}</h3>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs t-text-dim">
                      Avg: <span className="t-text-secondary" style={{ fontFamily: 'var(--font-mono)' }}>{stats.avg}</span>{' '}
                      {config.unit}
                    </span>
                    <span className="text-xs t-text-faint">|</span>
                    <span className="text-xs t-text-dim">
                      Range: <span className="t-text-secondary" style={{ fontFamily: 'var(--font-mono)' }}>{stats.min}</span> –{' '}
                      <span className="t-text-secondary" style={{ fontFamily: 'var(--font-mono)' }}>{stats.max}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {trend > 0.1 ? (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-semibold text-red-400">↑ Rising</span>
                    </>
                  ) : trend < -0.1 ? (
                    <>
                      <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400">↓ Falling</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-4 h-4 t-text-dim" />
                      <span className="text-xs font-semibold t-text-dim">— Stable</span>
                    </>
                  )}
                </div>
              </div>

              {/* Chart */}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      {/* Rich multi-stop gradient fill */}
                      <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={config.color} stopOpacity={theme === 'light' ? 0.25 : 0.35} />
                        <stop offset="40%" stopColor={config.color} stopOpacity={theme === 'light' ? 0.1 : 0.15} />
                        <stop offset="100%" stopColor={config.color} stopOpacity={0.02} />
                      </linearGradient>
                      {/* Line glow filter */}
                      <filter id={config.glowId} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartGridColor}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: chartTickColor }}
                      axisLine={{ stroke: chartAxisColor }}
                      tickLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: chartTickColor }}
                      axisLine={{ stroke: chartAxisColor }}
                      tickLine={false}
                      tickMargin={4}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={<CustomCursor />}
                    />

                    {/* Threshold Reference Lines */}
                    {thresholds && (
                      <>
                        <ReferenceLine
                          y={thresholds.warning}
                          stroke="#fbbf24"
                          strokeDasharray="8 4"
                          strokeWidth={1}
                          strokeOpacity={0.7}
                          label={{ value: 'Warning', position: 'insideTopRight', fill: '#fbbf24', fontSize: 9, fontWeight: 600 }}
                        />
                        <ReferenceLine
                          y={thresholds.critical}
                          stroke="#f87171"
                          strokeDasharray="8 4"
                          strokeWidth={1}
                          strokeOpacity={0.7}
                          label={{ value: 'Critical', position: 'insideTopRight', fill: '#f87171', fontSize: 9, fontWeight: 600 }}
                        />
                        {thresholds.warningLow !== undefined && (
                          <ReferenceLine
                            y={thresholds.warningLow}
                            stroke="#fbbf24"
                            strokeDasharray="8 4"
                            strokeWidth={1}
                            strokeOpacity={0.7}
                            label={{ value: 'Warn Low', position: 'insideBottomRight', fill: '#fbbf24', fontSize: 9, fontWeight: 600 }}
                          />
                        )}
                        {thresholds.criticalLow !== undefined && (
                          <ReferenceLine
                            y={thresholds.criticalLow}
                            stroke="#f87171"
                            strokeDasharray="8 4"
                            strokeWidth={1}
                            strokeOpacity={0.7}
                            label={{ value: 'Crit Low', position: 'insideBottomRight', fill: '#f87171', fontSize: 9, fontWeight: 600 }}
                          />
                        )}
                      </>
                    )}

                    {/* Main data area — smooth Bézier curve with glow */}
                    <Area
                      type="monotone"
                      dataKey={config.key}
                      name={config.label}
                      stroke={config.color}
                      strokeWidth={2.5}
                      fill={`url(#${config.gradientId})`}
                      dot={false}
                      activeDot={<GlowActiveDot />}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                      isAnimationActive={true}
                      style={{ filter: `url(#${config.glowId})` }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Threshold Legend */}
              {thresholds && (
                <div className="flex items-center gap-5 mt-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-0" style={{ borderTop: '2px dashed #fbbf24' }} />
                    <span className="text-[9px] text-amber-400/60 font-medium">Warning</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-0" style={{ borderTop: '2px dashed #f87171' }} />
                    <span className="text-[9px] text-red-400/60 font-medium">Critical</span>
                  </div>
                </div>
              )}

              {/* Stats Footer */}
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--t-border)' }}>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase t-text-faint">Min</span>
                    <p className="text-xs font-semibold text-cyan-400" style={{ fontFamily: 'var(--font-mono)' }}>
                      {stats.min} {config.unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase t-text-faint">Max</span>
                    <p className="text-xs font-semibold text-amber-400" style={{ fontFamily: 'var(--font-mono)' }}>
                      {stats.max} {config.unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase t-text-faint">Avg</span>
                    <p className="text-xs font-semibold t-text-secondary" style={{ fontFamily: 'var(--font-mono)' }}>
                      {stats.avg} {config.unit}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase t-text-faint">Rate of Change</span>
                  <p
                    className={`text-xs font-semibold ${
                      stats.rateOfChange > 0 ? 'text-red-400' : stats.rateOfChange < 0 ? 'text-emerald-400' : 't-text-dim'
                    }`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {stats.rateOfChange > 0 ? '+' : ''}
                    {stats.rateOfChange}/unit
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
