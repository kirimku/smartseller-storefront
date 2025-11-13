import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Input sanitization utilities
export function sanitizeSlug(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;
  // Trim, normalize, and remove unsafe characters; enforce pattern and length
  const trimmed = input.trim().toLowerCase();
  const cleaned = trimmed.replace(/[^a-z0-9-]/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
  if (!cleaned) return null;
  if (cleaned.length < 2 || cleaned.length > 63) return null;
  const pattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return pattern.test(cleaned) ? cleaned : null;
}

export function sanitizeString(input: string | undefined | null): string | undefined {
  if (input == null) return undefined;
  const s = String(input).replace(/[\n\r\t]/g, ' ').trim();
  return s || undefined;
}

export function sanitizePayload<T extends Record<string, unknown>>(payload: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(v => (typeof v === 'string' ? sanitizeString(v) : v));
    } else if (value && typeof value === 'object') {
      result[key] = sanitizePayload(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
