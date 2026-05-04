export interface SensorData {
  device_id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  gas_ppm: number;
  current_a: number;
  voltage_v: number;
  vibration: number;
  // MPU6050 accelerometer fields (optional — simulated when not provided by API)
  ax?: number;
  ay?: number;
  az?: number;
}

export type SystemStatus = 'healthy' | 'warning' | 'critical';

export interface FaultStatus {
  sensor: string;
  status: 'normal' | 'warning' | 'critical';
  message: string;
}

export interface Prediction {
  id: string;
  title: string;
  message: string;
  riskLevel: 'low' | 'medium' | 'high';
  sensor: string;
  icon: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: 'warning' | 'critical';
  faultType: string;
  message: string;
  sensor: string;
}

export interface HistoricalDataPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  gas_ppm: number;
  current_a: number;
  voltage_v: number;
  vibration: number;
}

export interface ImmediateAction {
  type: string;
  level: 'NORMAL' | 'WARNING' | 'CRITICAL';
  actions: string[];
  reason: string;
}
