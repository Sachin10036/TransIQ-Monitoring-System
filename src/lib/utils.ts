import { SensorData, FaultStatus, Prediction, Alert, HistoricalDataPoint, SystemStatus, ImmediateAction } from './types';

// ── Enrich SensorData ────────────────────────────────────────────────────
/**
 * Enrich SensorData — ensures vibration is always a proper float.
 * Call this after fetching data from the API.
 */
export function enrichSensorData(data: SensorData): SensorData {
  // Ensure vibration is always a proper float (API may return string or integer)
  const vibrationFloat = parseFloat(String(data.vibration));
  return {
    ...data,
    vibration: isNaN(vibrationFloat) ? 0 : vibrationFloat,
  };
}

// ── Fault Detection (Updated Thresholds) ─────────────────────────────────
export function detectFaults(data: SensorData): FaultStatus[] {
  const faults: FaultStatus[] = [];
  const vib = data.vibration;

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

  // Vibration (baseline-removed from firmware): Normal ≤0.06, Warning 0.06–0.15, Critical >0.15
  const absVib = Math.abs(vib);
  if (absVib > 0.15) {
    faults.push({ sensor: 'vibration', status: 'critical', message: `Abnormal vibration detected (${vib.toFixed(2)}g)` });
  } else if (absVib > 0.06) {
    faults.push({ sensor: 'vibration', status: 'warning', message: `Vibration elevated (${vib.toFixed(2)}g)` });
  } else {
    faults.push({ sensor: 'vibration', status: 'normal', message: `Vibration normal (${vib.toFixed(2)}g)` });
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
  const absVib = Math.abs(data.vibration);

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

  // Vibration penalty (baseline-removed firmware values)
  if (absVib > 0.15) score -= 20;
  else if (absVib > 0.06) score -= 10;

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

// ── Immediate Action Recommendations ─────────────────────────────────────
/**
 * Analyze current sensor readings and return real-time actionable suggestions.
 * Uses rule-based + value-based logic to determine severity and recommend
 * practical, industry-ready actions.
 */
export function getImmediateActions(data: SensorData): ImmediateAction[] {
  const actions: ImmediateAction[] = [];
  const absVib = Math.abs(data.vibration);

  // ── TEMPERATURE ────────────────────────────────────────────────────────
  if (data.temperature > 60) {
    actions.push({
      type: 'temperature',
      level: 'CRITICAL',
      actions: [
        'Shut down system immediately',
        'Inspect cooling system / fan',
        'Check for overload condition',
      ],
      reason: 'Temperature exceeds safe operating limit — risk of thermal damage, insulation failure, or fire.',
    });
  } else if (data.temperature >= 40) {
    actions.push({
      type: 'temperature',
      level: 'WARNING',
      actions: [
        'Check ventilation around equipment',
        'Monitor temperature rise over next 15 minutes',
      ],
      reason: 'Temperature is rising above normal operating range. Continued increase may trigger critical shutdown.',
    });
  }

  // ── VOLTAGE ────────────────────────────────────────────────────────────
  if (data.voltage_v < 200 || data.voltage_v > 260) {
    actions.push({
      type: 'voltage',
      level: 'CRITICAL',
      actions: [
        'Disconnect sensitive equipment immediately',
        'Check power supply or voltage regulator',
        'Use a voltage stabilizer',
      ],
      reason: 'Voltage is far outside safe range (220–240V) — risk of equipment damage, fire, or electrical failure.',
    });
  } else if (data.voltage_v < 220 || data.voltage_v > 240) {
    actions.push({
      type: 'voltage',
      level: 'WARNING',
      actions: [
        'Monitor voltage for next 10–15 minutes',
        'Check stabilizer output',
      ],
      reason: 'Voltage fluctuations detected. Sustained deviation can damage sensitive electronics and reduce equipment lifespan.',
    });
  }

  // ── GAS (MQ2) ──────────────────────────────────────────────────────────
  if (data.gas_ppm > 400) {
    actions.push({
      type: 'gas',
      level: 'CRITICAL',
      actions: [
        'Evacuate area immediately',
        'Check for gas leakage at all junctions',
        'Turn off all electrical sources',
      ],
      reason: 'Gas concentration exceeds safe limit — risk of explosion, toxic exposure, or fire hazard.',
    });
  } else if (data.gas_ppm >= 300) {
    actions.push({
      type: 'gas',
      level: 'WARNING',
      actions: [
        'Ensure adequate ventilation in the area',
        'Inspect nearby gas lines and seals',
      ],
      reason: 'Elevated gas levels detected. Early ventilation can prevent buildup to dangerous concentrations.',
    });
  }

  // ── VIBRATION (MPU6050) ────────────────────────────────────────────────
  if (absVib > 0.2) {
    actions.push({
      type: 'vibration',
      level: 'CRITICAL',
      actions: [
        'Stop machinery immediately',
        'Check for mechanical faults',
        'Inspect bearings, alignment, and couplings',
      ],
      reason: 'Severe vibration detected — risk of mechanical failure, bearing damage, or structural fatigue.',
    });
  } else if (absVib >= 0.05) {
    actions.push({
      type: 'vibration',
      level: 'WARNING',
      actions: [
        'Inspect mounting stability and bolt tightness',
        'Monitor vibration frequency pattern',
      ],
      reason: 'Vibration exceeds baseline. Early intervention can prevent progressive mechanical wear.',
    });
  }

  // ── CURRENT ────────────────────────────────────────────────────────────
  if (data.current_a > 15) {
    actions.push({
      type: 'current',
      level: 'CRITICAL',
      actions: [
        'Disconnect excessive load immediately',
        'Inspect wiring for damage or overheating',
        'Check circuit breaker rating',
      ],
      reason: 'Current draw exceeds rated capacity — risk of overheating, insulation damage, or fire.',
    });
  } else if (data.current_a > 12) {
    actions.push({
      type: 'current',
      level: 'WARNING',
      actions: [
        'Check load condition and distribution',
        'Verify wiring connections are secure',
      ],
      reason: 'Current approaching maximum rated capacity. Sustained high draw reduces conductor lifespan.',
    });
  }

  // ── HUMIDITY ───────────────────────────────────────────────────────────
  if (data.humidity > 70) {
    actions.push({
      type: 'humidity',
      level: 'CRITICAL',
      actions: [
        'Activate dehumidifier or increase ventilation',
        'Inspect enclosure seals for water ingress',
        'Check for condensation on circuit boards',
      ],
      reason: 'Extreme humidity can cause insulation breakdown, corrosion, and short circuits.',
    });
  } else if (data.humidity > 60 || data.humidity < 30) {
    actions.push({
      type: 'humidity',
      level: 'WARNING',
      actions: [
        'Monitor environmental conditions',
        'Verify HVAC or enclosure climate control',
      ],
      reason: data.humidity > 60
        ? 'Humidity above optimal range. Extended exposure risks corrosion and reduced equipment reliability.'
        : 'Humidity below optimal range. Low humidity increases static discharge risk and material brittleness.',
    });
  }

  return actions;
}

/**
 * Map a sensor type from ImmediateAction to its corresponding prediction sensor key.
 */
export function mapActionTypeToPredictionSensor(actionType: string): string {
  const mapping: Record<string, string> = {
    temperature: 'temperature',
    voltage: 'voltage_v',
    gas: 'gas_ppm',
    vibration: 'vibration',
    current: 'current_a',
    humidity: 'humidity',
  };
  return mapping[actionType] || actionType;
}

// ── Threshold Configs (for chart reference lines) ────────────────────────
export const thresholdConfig: Record<string, { warning: number; critical: number; warningLow?: number; criticalLow?: number }> = {
  temperature: { warning: 60, critical: 80 },
  humidity: { warning: 60, critical: 70 },
  gas_ppm: { warning: 300, critical: 400 },
  voltage_v: { warningLow: 220, warning: 240, criticalLow: 200, critical: 250 },
  current_a: { warning: 12, critical: 15 },
  vibration: { warning: 0.06, critical: 0.15 },
};
