'use client';

import React from 'react';
import { SystemStatus } from '@/lib/types';
import {
  LayoutDashboard,
  BarChart3,
  BrainCircuit,
  AlertTriangle,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  alertCount: number;
  systemStatus: SystemStatus;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'predictions', label: 'Predictions', icon: BrainCircuit },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'device', label: 'Device Info', icon: Cpu },
];

const statusDisplay = {
  healthy: { color: 'bg-emerald-400', label: 'System Online', textColor: 'text-emerald-400' },
  warning: { color: 'bg-amber-400', label: 'Warning Active', textColor: 'text-amber-400' },
  critical: { color: 'bg-red-400', label: 'Critical Fault', textColor: 'text-red-400' },
};

export default function Sidebar({ activePage, onPageChange, isOpen, onToggle, alertCount, systemStatus }: SidebarProps) {
  const sStatus = statusDisplay[systemStatus];

  return (
    <aside
      className="fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800/60"
      style={{
        width: isOpen ? '260px' : '72px',
        background: 'linear-gradient(180deg, rgba(10, 14, 26, 0.98) 0%, rgba(15, 23, 41, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo Area */}
      <div className="px-4 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {isOpen && (
            <div className="fade-in overflow-hidden">
              <h1 className="text-sm font-bold text-white tracking-wide">TransIQ</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Monitoring</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onPageChange(item.id)}
              className={`sidebar-link w-full group relative ${isActive ? 'active' : ''}`}
              title={!isOpen ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              {isOpen && (
                <span className="fade-in whitespace-nowrap">{item.label}</span>
              )}
              {item.id === 'alerts' && alertCount > 0 && (
                <span
                  className={`absolute flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ${
                    isOpen ? 'right-3 w-5 h-5' : 'top-1 right-1 w-4 h-4'
                  }`}
                >
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status */}
      {isOpen && (
        <div className="px-4 py-3 border-t border-slate-800/60 fade-in">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${sStatus.color} ${systemStatus !== 'healthy' ? 'pulse-dot' : 'live-dot'}`} />
            <span className={`text-[11px] font-medium ${sStatus.textColor}`}>{sStatus.label}</span>
          </div>
        </div>
      )}

      {/* Collapsed status dot */}
      {!isOpen && (
        <div className="px-3 py-3 border-t border-slate-800/60 flex justify-center">
          <div className={`w-2.5 h-2.5 rounded-full ${sStatus.color} ${systemStatus !== 'healthy' ? 'pulse-dot' : 'live-dot'}`} />
        </div>
      )}

      {/* Toggle */}
      <button
        id="sidebar-toggle"
        onClick={onToggle}
        className="p-3 border-t border-slate-800/60 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 transition-colors"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </aside>
  );
}
