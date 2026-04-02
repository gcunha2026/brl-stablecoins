import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory rate limiter (per-IP, sliding window)
// On Vercel serverless this resets per cold start, which is acceptable.
// For stricter limits consider Upstash Redis (@upstash/ratelimit).
// ---------------------------------------------------------------------------

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // per window per IP

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanupIfNeeded() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  });
}

function isRateLimited(ip: string): boolean {
  cleanupIfNeeded();
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}

// ---------------------------------------------------------------------------
// Allowed origins for CORS
// ---------------------------------------------------------------------------

function getAllowedOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin") ?? "";
  const allowed = [
    process.env.NEXT_PUBLIC_SITE_URL,
    "http://localhost:3000",
    "https://localhost:3000",
  ].filter(Boolean);

  // In production, also allow the Vercel deployment URLs
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) allowed.push(`https://${vercelUrl}`);

  if (allowed.includes(origin)) return origin;
  // Allow same-origin requests (no Origin header)
  if (!origin) return null;
  return null;
}

// ---------------------------------------------------------------------------
// Security headers applied to every response
// ---------------------------------------------------------------------------

function addSecurityHeaders(res: NextResponse, allowedOrigin: string | null) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // CORS
  if (allowedOrigin) {
    res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Max-Age", "86400");
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const allowedOrigin = getAllowedOrigin(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    addSecurityHeaders(res, allowedOrigin);
    return res;
  }

  // Rate limit API routes
  if (pathname.startsWith("/api/")) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      const res = NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
      res.headers.set("Retry-After", "60");
      addSecurityHeaders(res, allowedOrigin);
      return res;
    }

    // Block non-GET methods on public API routes (only cron uses GET with auth)
    if (req.method !== "GET") {
      const res = NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
      addSecurityHeaders(res, allowedOrigin);
      return res;
    }
  }

  // Continue with security headers on all responses
  const res = NextResponse.next();
  addSecurityHeaders(res, allowedOrigin);
  return res;
}

export const config = {
  matcher: [
    // Apply to all API routes and pages (skip static files and _next)
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
