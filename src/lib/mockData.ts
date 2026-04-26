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

export function generateDayData(): HistoricalDataPoint[] {
  const timestamps = generateTimestamps(24, 60); // 24 hourly readings
  let temp = 35;
  
  return timestamps.map((ts, i) => {
    // Simulate gradual temperature increase during the day
    temp += randomBetween(-0.5, 1.2);
    temp = Math.max(28, Math.min(75, temp));
    
    return {
      timestamp: ts,
      temperature: +temp.toFixed(1),
      humidity: randomBetween(35, 68),
      gas_ppm: randomBetween(200, 380) + (i > 18 ? randomBetween(0, 80) : 0),
      current_a: randomBetween(6, 14),
      voltage_v: randomBetween(210, 245) + (Math.random() > 0.9 ? randomBetween(-15, 15) : 0),
      vibration: randomBetween(-1.5, 1.5),
    };
  });
}

export function generateWeekData(): HistoricalDataPoint[] {
  const timestamps = generateTimestamps(7 * 4, 360); // 4 readings per day for 7 days
  let temp = 33;
  
  return timestamps.map((ts, i) => {
    temp += randomBetween(-1, 1.5);
    temp = Math.max(28, Math.min(72, temp));
    
    return {
      timestamp: ts,
      temperature: +temp.toFixed(1),
      humidity: randomBetween(32, 68),
      gas_ppm: randomBetween(180, 380) + (i > 20 ? randomBetween(0, 100) : 0),
      current_a: randomBetween(5, 14),
      voltage_v: randomBetween(210, 245),
      vibration: randomBetween(-1.5, 1.5),
    };
  });
}

export function generateMonthData(): HistoricalDataPoint[] {
  const timestamps = generateTimestamps(30, 1440); // 1 reading per day for 30 days
  let temp = 32;
  
  return timestamps.map((ts) => {
    temp += randomBetween(-2, 2.5);
    temp = Math.max(25, Math.min(78, temp));
    
    return {
      timestamp: ts,
      temperature: +temp.toFixed(1),
      humidity: randomBetween(30, 72),
      gas_ppm: randomBetween(150, 420),
      current_a: randomBetween(4, 15),
      voltage_v: randomBetween(205, 248),
      vibration: randomBetween(-1.5, 1.5),
    };
  });
}
