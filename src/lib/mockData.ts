import { HistoricalDataPoint } from './types';

function randomBetween(min: number, max: number): number {
  return +(min + Math.random() * (max - min)).toFixed(2);
}

function generateTimestamps(count: number, intervalMinutes: number): string[] {
  const now = new Date();
  const timestamps: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
    timestamps.push(d.toISOString());
  }
  return timestamps;
}

function generateVibrationMagnitude(isAbnormal: boolean): number {
  if (isAbnormal) {
    // Warning to Critical range
    return randomBetween(1.3, 3.2);
  }
  // Normal range
  return randomBetween(0.6, 1.1);
}

export function generateDayData(): HistoricalDataPoint[] {
  const timestamps = generateTimestamps(24, 60); // 24 hourly readings
  let temp = 35;
  let oil = 95;
  
  return timestamps.map((ts, i) => {
    // Simulate gradual temperature increase during the day
    temp += randomBetween(-0.5, 1.2);
    temp = Math.max(28, Math.min(75, temp));
    
    // Simulate gradual oil decrease
    oil -= randomBetween(0, 0.8);
    oil = Math.max(60, oil);
    
    const isVibAbnormal = Math.random() > 0.92;
    
    return {
      timestamp: ts,
      temperature: +temp.toFixed(1),
      humidity: randomBetween(35, 68),
      gas_ppm: randomBetween(200, 380) + (i > 18 ? randomBetween(0, 80) : 0),
      current_a: randomBetween(6, 14),
      voltage_v: randomBetween(210, 245) + (Math.random() > 0.9 ? randomBetween(-15, 15) : 0),
      oil_distance_cm: +oil.toFixed(2),
      vibration: isVibAbnormal ? 1 : 0,
      vibration_magnitude: generateVibrationMagnitude(isVibAbnormal),
    };
  });
}

export function generateWeekData(): HistoricalDataPoint[] {
  const timestamps = generateTimestamps(7 * 4, 360); // 4 readings per day for 7 days
  let temp = 33;
  let oil = 100;
  
  return timestamps.map((ts, i) => {
    temp += randomBetween(-1, 1.5);
    temp = Math.max(28, Math.min(72, temp));
    oil -= randomBetween(0, 1.2);
    oil = Math.max(50, oil);
    
    const isVibAbnormal = Math.random() > 0.9;
    
    return {
      timestamp: ts,
      temperature: +temp.toFixed(1),
      humidity: randomBetween(32, 68),
      gas_ppm: randomBetween(180, 380) + (i > 20 ? randomBetween(0, 100) : 0),
      current_a: randomBetween(5, 14),
      voltage_v: randomBetween(210, 245),
      oil_distance_cm: +oil.toFixed(2),
      vibration: isVibAbnormal ? 1 : 0,
      vibration_magnitude: generateVibrationMagnitude(isVibAbnormal),
    };
  });
}

export function generateMonthData(): HistoricalDataPoint[] {
  const timestamps = generateTimestamps(30, 1440); // 1 reading per day for 30 days
  let temp = 32;
  let oil = 110;
  
  return timestamps.map((ts) => {
    temp += randomBetween(-2, 2.5);
    temp = Math.max(25, Math.min(78, temp));
    oil -= randomBetween(0.2, 2);
    oil = Math.max(40, oil);
    
    const isVibAbnormal = Math.random() > 0.85;
    
    return {
      timestamp: ts,
      temperature: +temp.toFixed(1),
      humidity: randomBetween(30, 72),
      gas_ppm: randomBetween(150, 420),
      current_a: randomBetween(4, 15),
      voltage_v: randomBetween(205, 248),
      oil_distance_cm: +oil.toFixed(2),
      vibration: isVibAbnormal ? 1 : 0,
      vibration_magnitude: generateVibrationMagnitude(isVibAbnormal),
    };
  });
}
