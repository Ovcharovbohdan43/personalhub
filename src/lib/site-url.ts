/**
 * Resolves the public site URL for auth redirects and email links.
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL (explicit, recommended for production)
 * 2. VERCEL_PROJECT_PRODUCTION_URL (Vercel production domain)
 * 3. VERCEL_URL (current deployment, preview or production)
 * 4. localhost (local development only)
 */
export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/\/$/, '');
  if (production) return production.startsWith('http') ? production : `https://${production}`;

  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, '');
  if (vercel) return vercel.startsWith('http') ? vercel : `https://${vercel}`;

  return 'http://localhost:3000';
}
