/**
 * Rate limiting backed by Supabase.
 * Survives server restarts and works across Vercel serverless instances.
 *
 * Falls back to in-memory if Supabase is unavailable.
 */

import { createAdminClient } from '@/lib/supabase/admin';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

// In-memory fallback (same as before, used if DB fails)
const memoryCache = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a given key.
 * Uses Supabase RPC for persistence, falls back to memory.
 *
 * @param key - Unique identifier (e.g., normalized phone number)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 1 hour)
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60 * 60 * 1000
): Promise<RateLimitResult> {
  try {
    const admin = createAdminClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    // Count recent requests from this key
    const { count, error } = await admin
      .from('pending_requests')
      .select('id', { count: 'exact', head: true })
      .eq('client_phone', key)
      .gte('created_at', windowStart.toISOString());

    if (error) throw error;

    const currentCount = count || 0;
    const allowed = currentCount < maxRequests;
    const remaining = Math.max(0, maxRequests - currentCount);
    const resetAt = new Date(now.getTime() + windowMs);

    return { allowed, remaining, resetAt };
  } catch (error) {
    // Fallback to in-memory rate limiting
    console.warn('[RateLimit] Supabase unavailable, using memory fallback:', error);
    return checkMemoryRateLimit(key, maxRequests, windowMs);
  }
}

function checkMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const record = memoryCache.get(key);

  if (!record || now > record.resetTime) {
    memoryCache.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: new Date(now + windowMs) };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: new Date(record.resetTime) };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: new Date(record.resetTime),
  };
}
