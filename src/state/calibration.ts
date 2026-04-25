const STORAGE_KEY = 'printable:calibration';

export type CalibrationRecord = {
  naturalPixelsPerInch: number;
};

type CalibrationStore = Record<string, CalibrationRecord>;

function load(): CalibrationStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CalibrationStore) : {};
  } catch {
    return {};
  }
}

export function getCalibration(garmentId: string): CalibrationRecord | null {
  return load()[garmentId] ?? null;
}

export function setCalibration(garmentId: string, record: CalibrationRecord): void {
  const store = load();
  store[garmentId] = record;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function clearCalibration(garmentId: string): void {
  const store = load();
  delete store[garmentId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
