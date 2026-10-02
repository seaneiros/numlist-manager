import { AjaxStatusFactory } from './ajaxStatus';

export * from './ajaxStatus';
export const AjaxStatus = new AjaxStatusFactory();

export function asNumber(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^0+/, '');
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
