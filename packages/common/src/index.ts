export * from './UnhandledValueError.js';
export * from './ApiError.js';

export type HealthResponse = {
  status: 'ok';
  time: string;
}

export const Time = {
  Second: 1000,
  Minute: 60 * 1000,
  Hour: 60 * 60 * 1000,
} as const;