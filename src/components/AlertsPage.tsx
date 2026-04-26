'use client';

import React, { useState } from 'react';
import { Alert, FaultStatus } from '@/lib/types';
import { formatTimestamp, getSensorLabel } from '@/lib/utils';
import {
  AlertTriangle,
  AlertCircle,
  Filter,
  Bell,
  ShieldAlert,
} from 'lucide-react';

interface AlertsPageProps {
  alerts: Alert[];
  faults: FaultStatus[];
}

const severityConfig = {
  critical: {
    icon: ShieldAlert,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    label: 'Warning',
  },
};

type SeverityFilter = 'all' | 'critical' | 'warning';

export default function AlertsPage({ alerts, faults }: AlertsPageProps) {
  const [filter, setFilter] = useState<SeverityFilter>('all');

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter);
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 t-text-primary">
            <Bell className="w-7 h-7 text-cyan-400" />
            Alerts
          </h1>
          <p className="text-sm mt-1 t-text-dim">
            Active fault detections and system warnings
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--t-input-bg)', border: '1px solid var(--t-border)' }} id="alert-filter-tabs">
          {(['all', 'critical', 'warning'] as SeverityFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                filter === f
                  ? f === 'critical'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : f === 'warning'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'border border-transparent'
              }`}
              style={filter !== f ? { color: 'var(--t-text-dim)' } : undefined}
            >
              {f === 'all' ? `All (${alerts.length})` : `${f} (${f === 'critical' ? criticalCount : warningCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Counts Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-xl border border-red-500/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase t-text-dim">Critical</span>
            <p className="text-xl font-bold text-red-400" style={{ fontFamily: 'var(--font-mono)' }}>{criticalCount}</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-amber-500/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase t-text-dim">Warning</span>
            <p className="text-xl font-bold text-amber-400" style={{ fontFamily: 'var(--font-mono)' }}>{warningCount}</p>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--t-text-faint)' }} />
          <h3 className="text-lg font-semibold mb-2 t-text-primary">No Alerts</h3>
          <p className="text-sm t-text-dim">
            {filter === 'all' ? 'All systems operating within normal parameters.' : `No ${filter} severity alerts at this time.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert, index) => {
            const config = severityConfig[alert.severity];
            const SeverityIcon = config.icon;

            return (
              <div
                key={alert.id}
                className={`glass-card p-5 rounded-2xl border ${config.border} slide-up`}
                style={{ animationDelay: `${index * 60}ms` }}
                id={`alert-${alert.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <SeverityIcon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-semibold t-text-primary">{alert.faultType}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.badge}`}>
                        {config.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium t-text-muted" style={{ background: 'var(--t-input-bg)', border: '1px solid var(--t-border)' }}>
                        {getSensorLabel(alert.sensor)}
                      </span>
                    </div>
                    <p className="text-sm mt-1 t-text-muted">{alert.message}</p>
                    <p className="text-xs mt-2 flex items-center gap-1.5 t-text-faint">
                      <span className="inline-block w-1 h-1 rounded-full" style={{ background: 'var(--t-text-faint)' }} />
                      {formatTimestamp(alert.timestamp)}
                    </p>
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
