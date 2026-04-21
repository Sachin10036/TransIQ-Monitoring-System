import { SensorData, FaultStatus, Prediction, Alert, HistoricalDataPoint, SystemStatus } from './types';

// ── MPU6050 Vibration Computation ────────────────────────────────────────
/**
 * Compute vibration magnitude from MPU6050 accelerometer data.
 * If ax/ay/az are not available from API, simulate values from the binary vibration flag.
 * When real MPU6050 data is available, simply pass ax/ay/az directly.
 */
export function computeVibrationMagnitude(data: SensorData): number {
  let ax = data.ax;
  let ay = data.ay;
  let az = data.az;

  if (ax === undefined || ay === undefined || az === undefined) {
    // Simulate MPU6050 values from binary vibration flag
    if (data.vibration === 1) {
      // Abnormal vibration — simulate high magnitude
      ax = 1.8 + Math.random() * 1.2;
      ay = 0.8 + Math.random() * 0.6;
      az = 1.0 + Math.random() * 0.8;
    } else {
      // Normal — simulate idle accelerometer near 1g
      ax = 0.02 + Math.random() * 0.15;
      ay = 0.02 + Math.random() * 0.1;
      az = 0.95 + Math.random() * 0.1;
    }
  }

  return Math.sqrt(ax * ax + ay * ay + az * az);
}

/**
 * Enrich SensorData with computed vibration magnitude.
 * Call this after fetching data from the API.
 */
export function enrichSensorData(data: SensorData): SensorData {
  return {
    ...data,
    vibration_magnitude: computeVibrationMagnitude(data),
  };
}

// ── Fault Detection (Updated Thresholds) ─────────────────────────────────
export function detectFaults(data: SensorData, oilHistory?: number[]): FaultStatus[] {
  const faults: FaultStatus[] = [];
  const vibMag = data.vibration_magnitude ?? computeVibrationMagnitude(data);

  // Temperature (°C): Normal 30–60, Warning 60–80, Critical >80
  if (data.temperature > 80) {
    faults.push({ sensor: 'temperature', status: 'critical', message: 'Temperature exceeds critical threshold (>80°C)' });
  } else if (data.temperature > 60) {
    faults.push({ sensor: 'temperature', status: 'warning', message: 'Temperature elevated (>60°C)' });
  } else if (data.temperature < 30) {
    faults.push({ sensor: 'temperature', status: 'normal', message: 'Temperature below normal range (<30°C)' });
  } else {
    faults.push({ sensor: 'temperature', status: 'normal', message: 'Temperature normal (30–60°C)' });
  }

  // Humidity (%): Normal 30–60, Warning 60–70, Critical >70
  if (data.humidity > 70) {
    faults.push({ sensor: 'humidity', status: 'critical', message: 'Humidity critical (>70%)' });
  } else if (data.humidity > 60) {
    faults.push({ sensor: 'humidity', status: 'warning', message: 'Humidity elevated (>60%)' });
  } else if (data.humidity < 30) {
    faults.push({ sensor: 'humidity', status: 'warning', message: 'Humidity too low (<30%)' });
  } else {
    faults.push({ sensor: 'humidity', status: 'normal', message: 'Humidity normal (30–60%)' });
  }

  // Gas (PPM): Normal <300, Warning 300–400, Critical >400
  if (data.gas_ppm > 400) {
    faults.push({ sensor: 'gas_ppm', status: 'critical', message: 'Gas level critical (>400 PPM)' });
  } else if (data.gas_ppm > 300) {
    faults.push({ sensor: 'gas_ppm', status: 'warning', message: 'Gas level elevated (300–400 PPM)' });
  } else {
    faults.push({ sensor: 'gas_ppm', status: 'normal', message: 'Gas level normal (<300 PPM)' });
  }

  // Voltage (V): Normal 220–240, Warning 200–220 OR 240–250, Critical <200 OR >250
  if (data.voltage_v < 200 || data.voltage_v > 250) {
    faults.push({ sensor: 'voltage_v', status: 'critical', message: `Voltage fault (${data.voltage_v}V — expected 220–240V)` });
  } else if (data.voltage_v < 220 || data.voltage_v > 240) {
    faults.push({ sensor: 'voltage_v', status: 'warning', message: `Voltage near boundary (${data.voltage_v}V)` });
  } else {
    faults.push({ sensor: 'voltage_v', status: 'normal', message: 'Voltage normal (220–240V)' });
  }

  // Current (A): Rated 15A — Normal 0–12, Warning 12–15, Critical >15
  if (data.current_a > 15) {
    faults.push({ sensor: 'current_a', status: 'critical', message: 'Current overload (>15A)' });
  } else if (data.current_a > 12) {
    faults.push({ sensor: 'current_a', status: 'warning', message: 'Current high (12–15A)' });
  } else {
    faults.push({ sensor: 'current_a', status: 'normal', message: 'Current normal (0–12A)' });
  }

  // Oil Level (cm): Use trend from history
  if (oilHistory && oilHistory.length >= 3) {
    const trend = calculateTrend(oilHistory.slice(-10));
    if (trend > 2) {
      faults.push({ sensor: 'oil_distance_cm', status: 'critical', message: 'Oil leakage suspected — continuous increasing distance' });
    } else if (trend > 0.5) {
      faults.push({ sensor: 'oil_distance_cm', status: 'warning', message: 'Oil level decreasing — slight trend detected' });
    } else {
      faults.push({ sensor: 'oil_distance_cm', status: 'normal', message: 'Oil level stable' });
    }
  } else {
    // Fallback without history
    if (data.oil_distance_cm > 150) {
      faults.push({ sensor: 'oil_distance_cm', status: 'critical', message: 'Oil level critical — possible leakage' });
    } else if (data.oil_distance_cm > 120) {
      faults.push({ sensor: 'oil_distance_cm', status: 'warning', message: 'Oil level low' });
    } else {
      faults.push({ sensor: 'oil_distance_cm', status: 'normal', message: 'Oil level normal' });
    }
  }

  // Vibration (MPU6050): Normal <1.2, Warning 1.2–2.5, Critical >2.5
  if (vibMag > 2.5) {
    faults.push({ sensor: 'vibration', status: 'critical', message: `Abnormal vibration detected (${vibMag.toFixed(2)}g)` });
  } else if (vibMag > 1.2) {
    faults.push({ sensor: 'vibration', status: 'warning', message: `Vibration elevated (${vibMag.toFixed(2)}g)` });
  } else {
    faults.push({ sensor: 'vibration', status: 'normal', message: `Vibration normal (${vibMag.toFixed(2)}g)` });
  }

  return faults;
}

// ── Global System Status ─────────────────────────────────────────────────
export function getGlobalSystemStatus(faults: FaultStatus[]): SystemStatus {
  if (faults.some(f => f.status === 'critical')) return 'critical';
  if (faults.some(f => f.status === 'warning')) return 'warning';
  return 'healthy';
}

// ── Health Score (Updated Thresholds) ────────────────────────────────────
export function calculateHealthScore(data: SensorData): number {
  let score = 100;
  const vibMag = data.vibration_magnitude ?? computeVibrationMagnitude(data);

  // Temperature penalty
  if (data.temperature > 80) score -= 25;
  else if (data.temperature > 60) score -= 10;

  // Humidity penalty
  if (data.humidity > 70) score -= 15;
  else if (data.humidity > 60 || data.humidity < 30) score -= 5;

  // Gas penalty
  if (data.gas_ppm > 400) score -= 20;
  else if (data.gas_ppm > 300) score -= 10;

  // Voltage penalty
  if (data.voltage_v < 200 || data.voltage_v > 250) score -= 20;
  else if (data.voltage_v < 220 || data.voltage_v > 240) score -= 8;

  // Current penalty
  if (data.current_a > 15) score -= 20;
  else if (data.current_a > 12) score -= 8;

  // Vibration penalty (MPU6050)
  if (vibMag > 2.5) score -= 20;
  else if (vibMag > 1.2) score -= 10;

  // Oil penalty
  if (data.oil_distance_cm > 150) score -= 15;
  else if (data.oil_distance_cm > 120) score -= 8;

  return Math.max(0, Math.min(100, score));
}

export function getHealthStatus(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Healthy', color: 'emerald' };
  if (score >= 50) return { label: 'Warning', color: 'amber' };
  return { label: 'Critical', color: 'red' };
}

// ── Predictions ──────────────────────────────────────────────────────────
export function generatePredictions(history: HistoricalDataPoint[]): Prediction[] {
  const predictions: Prediction[] = [];
  if (history.length < 5) return predictions;

  const recent = history.slice(-10);

  // Oil Level Prediction
  const oilTrend = calculateTrend(recent.map(d => d.oil_distance_cm));
  if (oilTrend > 0.5) {
    predictions.push({
      id: 'oil-leak',
      title: 'Possible Oil Leakage',
      message: 'Oil level sensor shows continuous decrease in oil reserves. Distance readings increasing steadily — potential slow leak detected.',
      riskLevel: oilTrend > 2 ? 'high' : oilTrend > 1 ? 'medium' : 'low',
      sensor: 'oil_distance_cm',
      icon: 'droplet',
    });
  }

  // Temperature Trend
  const tempTrend = calculateTrend(recent.map(d => d.temperature));
  if (tempTrend > 0.3) {
    predictions.push({
      id: 'overheat',
      title: 'Overheating Risk',
      message: 'Temperature shows a steady upward trend. If this continues, critical threshold may be breached within hours.',
      riskLevel: tempTrend > 1.5 ? 'high' : tempTrend > 0.8 ? 'medium' : 'low',
      sensor: 'temperature',
      icon: 'thermometer',
    });
  }

  // Current Trend
  const currentTrend = calculateTrend(recent.map(d => d.current_a));
  if (currentTrend > 0.2) {
    predictions.push({
      id: 'overload',
      title: 'Overload Risk',
      message: 'Current draw is gradually increasing. Monitor load conditions to prevent equipment overload.',
      riskLevel: currentTrend > 1 ? 'high' : currentTrend > 0.5 ? 'medium' : 'low',
      sensor: 'current_a',
      icon: 'zap',
    });
  }

  // Voltage Fluctuation
  const voltageStd = calculateStdDev(recent.map(d => d.voltage_v));
  if (voltageStd > 5) {
    predictions.push({
      id: 'voltage-instability',
      title: 'Voltage Instability',
      message: 'Voltage readings show significant fluctuation pattern. Grid instability or faulty regulation suspected.',
      riskLevel: voltageStd > 15 ? 'high' : voltageStd > 10 ? 'medium' : 'low',
      sensor: 'voltage_v',
      icon: 'activity',
    });
  }

  // Gas Increase
  const gasTrend = calculateTrend(recent.map(d => d.gas_ppm));
  if (gasTrend > 1) {
    predictions.push({
      id: 'internal-fault',
      title: 'Internal Fault Risk',
      message: 'Gas PPM readings show a rising trend — possible internal insulation degradation or arcing.',
      riskLevel: gasTrend > 5 ? 'high' : gasTrend > 3 ? 'medium' : 'low',
      sensor: 'gas_ppm',
      icon: 'wind',
    });
  }

  return predictions;
}

// ── Analytics Helpers ────────────────────────────────────────────────────
export function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

export function calculateStdDev(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / n);
}

export function getStats(values: number[]) {
  if (values.length === 0) return { avg: 0, min: 0, max: 0, rateOfChange: 0 };
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const rateOfChange = values.length > 1 ? calculateTrend(values) : 0;
  return { avg: +avg.toFixed(2), min: +min.toFixed(2), max: +max.toFixed(2), rateOfChange: +rateOfChange.toFixed(3) };
}

// ── Smart Alerts Generation ──────────────────────────────────────────────
const alertTitleMap: Record<string, { warning: string; critical: string }> = {
  temperature: { warning: 'High Temperature Warning', critical: 'High Temperature Detected' },
  humidity: { warning: 'Humidity Warning', critical: 'Humidity Critical' },
  gas_ppm: { warning: 'Gas Level Warning', critical: 'Gas Level High' },
  voltage_v: { warning: 'Voltage Warning', critical: 'Voltage Fault' },
  current_a: { warning: 'Current Warning', critical: 'Overload Condition' },
  oil_distance_cm: { warning: 'Oil Level Warning', critical: 'Oil Leakage Suspected' },
  vibration: { warning: 'Vibration Warning', critical: 'Abnormal Vibration Detected' },
};

export function generateAlerts(data: SensorData, faults: FaultStatus[]): Alert[] {
  const alerts: Alert[] = [];
  const ts = data.timestamp;

  faults.forEach((f) => {
    if (f.status !== 'normal') {
      const severity: 'warning' | 'critical' = f.status === 'critical' ? 'critical' : 'warning';
      const titles = alertTitleMap[f.sensor];
      const title = titles ? titles[severity] : getSensorLabel(f.sensor);

      alerts.push({
        id: `${f.sensor}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: ts,
        severity,
        faultType: title,
        message: f.message,
        sensor: f.sensor,
      });
    }
  });

  return alerts;
}

export function getSensorLabel(key: string): string {
  const labels: Record<string, string> = {
    temperature: 'Temperature',
    humidity: 'Humidity',
    gas_ppm: 'Gas (PPM)',
    current_a: 'Current (A)',
    voltage_v: 'Voltage (V)',
    oil_distance_cm: 'Oil Level (cm)',
    vibration: 'Vibration',
  };
  return labels[key] || key;
}

export function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return ts;
  }
}

// ── Threshold Configs (for chart reference lines) ────────────────────────
export const thresholdConfig: Record<string, { warning: number; critical: number; warningLow?: number; criticalLow?: number }> = {
  temperature: { warning: 60, critical: 80 },
  humidity: { warning: 60, critical: 70 },
  gas_ppm: { warning: 300, critical: 400 },
  voltage_v: { warningLow: 220, warning: 240, criticalLow: 200, critical: 250 },
  current_a: { warning: 12, critical: 15 },
  vibration_magnitude: { warning: 1.2, critical: 2.5 },
};
