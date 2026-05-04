'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SensorData, FaultStatus, Prediction, Alert, HistoricalDataPoint, SystemStatus } from '@/lib/types';
import {
  detectFaults,
  calculateHealthScore,
  generatePredictions,
  generateAlerts,
  enrichSensorData,
  getGlobalSystemStatus,
} from '@/lib/utils';
import { generateDayData, generateWeekData, generateMonthData } from '@/lib/mockData';
import Sidebar from '@/components/Sidebar';
import DashboardPage from '@/components/DashboardPage';
import AnalyticsPage from '@/components/AnalyticsPage';
import PredictionsPage from '@/components/PredictionsPage';
import AlertsPage from '@/components/AlertsPage';
import DeviceInfoPage from '@/components/DeviceInfoPage';
import SoundAlertProvider from '@/components/SoundAlertProvider';

const API_URL = 'https://17eznckrdf.execute-api.eu-north-1.amazonaws.com/data';
const POLL_INTERVAL_MS = 4000; // 4 seconds
const MAX_HISTORY_POINTS = 20;
const RETRY_DELAY_MS = 10000;

type ConnectionStatus = 'connected' | 'lost' | 'reconnecting';

export default function Home() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Real-time state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [historicalBuffer, setHistoricalBuffer] = useState<HistoricalDataPoint[]>([]);
  const [alertHistory, setAlertHistory] = useState<Alert[]>([]);

  // Refs for intervals
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data from API
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);

      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      let latestRecord: SensorData;
      if (Array.isArray(data) && data.length > 0) {
        latestRecord = data[data.length - 1];
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        latestRecord = data;
      } else {
        throw new Error('Invalid API response format');
      }

      // Enrich — ensures vibration is a proper float
      const enriched = enrichSensorData(latestRecord);

      setSensorData(enriched);
      setLastUpdated(new Date());
      setConnectionStatus('connected');
      setError(null);

      // Update rolling historical buffer (dedup by timestamp, keep last N)
      setHistoricalBuffer((prev) => {
        const isDuplicate = prev.some((p) => p.timestamp === enriched.timestamp);
        if (isDuplicate) return prev;

        const newPoint: HistoricalDataPoint = {
          timestamp: enriched.timestamp,
          temperature: enriched.temperature,
          humidity: enriched.humidity,
          gas_ppm: enriched.gas_ppm,
          current_a: enriched.current_a,
          voltage_v: enriched.voltage_v,
          vibration: enriched.vibration,
        };

        const updated = [...prev, newPoint];
        return updated.slice(-MAX_HISTORY_POINTS);
      });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to fetch sensor data';

      if (isInitial) {
        setError(errMessage);
      } else {
        // Non-initial failure: mark connection lost, schedule retry
        setConnectionStatus('lost');

        // Clear polling and schedule a retry
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        retryTimeoutRef.current = setTimeout(() => {
          setConnectionStatus('reconnecting');
          fetchData(false).then(() => {
            // If successful, restart polling
            if (autoRefresh) {
              startPolling();
            }
          });
        }, RETRY_DELAY_MS);
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      fetchData(false);
    }, POLL_INTERVAL_MS);
  }, [fetchData]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh polling
  useEffect(() => {
    if (autoRefresh && sensorData && !error) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [autoRefresh, sensorData, error, startPolling, stopPolling]);

  // Generate mock historical data (for analytics page time filters)
  const historicalData = useMemo<Record<string, HistoricalDataPoint[]>>(() => ({
    day: generateDayData(),
    week: generateWeekData(),
    month: generateMonthData(),
  }), []);

  // Derived state
  const faults = useMemo<FaultStatus[]>(
    () => (sensorData ? detectFaults(sensorData) : []),
    [sensorData]
  );

  const healthScore = useMemo(
    () => (sensorData ? calculateHealthScore(sensorData) : 0),
    [sensorData]
  );

  const globalStatus = useMemo<SystemStatus>(
    () => getGlobalSystemStatus(faults),
    [faults]
  );

  const predictions = useMemo<Prediction[]>(
    () => generatePredictions(historicalBuffer.length >= 5 ? historicalBuffer : historicalData.day),
    [historicalBuffer, historicalData]
  );

  // Accumulate alerts over time (keep last 50)
  useEffect(() => {
    if (sensorData && faults.length > 0) {
      const newAlerts = generateAlerts(sensorData, faults);
      if (newAlerts.length > 0) {
        setAlertHistory((prev) => {
          const combined = [...newAlerts, ...prev];
          // Dedup by sensor+severity (keep most recent)
          const seen = new Set<string>();
          const deduped = combined.filter((a) => {
            const key = `${a.sensor}-${a.severity}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          return deduped.slice(0, 50);
        });
      }
    }
  }, [sensorData, faults]);

  // Loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--t-bg)' }}>
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-t-cyan-400 rounded-full animate-spin-slow mx-auto" style={{ borderColor: 'var(--t-border)', borderTopColor: '#22d3ee' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2 t-text-secondary">TransIQ Monitoring System</h2>
          <p className="text-sm t-text-dim">Connecting to sensors...</p>
        </div>
      </div>
    );
  }

  // Error screen (only on initial load failure)
  if (error && !sensorData) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--t-bg)' }}>
        <div className="glass-card p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-400 mb-2">Connection Failed</h2>
          <p className="text-sm t-text-muted mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchData(true);
            }}
            className="px-6 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!sensorData) return null;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            data={sensorData}
            faults={faults}
            healthScore={healthScore}
            globalStatus={globalStatus}
            autoRefresh={autoRefresh}
            onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
            lastUpdated={lastUpdated}
            connectionStatus={connectionStatus}
          />
        );
      case 'analytics':
        return (
          <AnalyticsPage
            historicalData={historicalData}
            realtimeBuffer={historicalBuffer}
          />
        );
      case 'predictions':
        return <PredictionsPage predictions={predictions} sensorData={sensorData} />;
      case 'alerts':
        return <AlertsPage alerts={alertHistory} faults={faults} />;
      case 'device':
        return <DeviceInfoPage data={sensorData} healthScore={healthScore} />;
      default:
        return (
          <DashboardPage
            data={sensorData}
            faults={faults}
            healthScore={healthScore}
            globalStatus={globalStatus}
            autoRefresh={autoRefresh}
            onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
            lastUpdated={lastUpdated}
            connectionStatus={connectionStatus}
          />
        );
    }
  };

  return (
    <SoundAlertProvider systemStatus={globalStatus}>
      <div className="flex min-h-screen" style={{ background: 'var(--t-bg)' }}>
        <Sidebar
          activePage={activePage}
          onPageChange={setActivePage}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          alertCount={alertHistory.length}
          systemStatus={globalStatus}
        />
        <main
          className="flex-1 transition-all duration-300 ease-in-out"
          style={{ marginLeft: sidebarOpen ? '260px' : '72px' }}
        >
          <div className="p-6 max-w-[1600px] mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </SoundAlertProvider>
  );
}
