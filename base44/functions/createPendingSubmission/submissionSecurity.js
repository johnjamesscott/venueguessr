export const SUBMISSION_TTL_MS = 24 * 60 * 60 * 1_000;

const parseTimestamp = (value) => {
  const timestamp = Date.parse(value || '');
  return Number.isFinite(timestamp) ? timestamp : null;
};

export function isSubmissionExpired(submission, now = Date.now()) {
  const explicitExpiry = parseTimestamp(submission?.expires_at);
  if (explicitExpiry !== null) return now >= explicitExpiry;
  const createdAt = parseTimestamp(submission?.created_date);
  return createdAt !== null && now - createdAt >= SUBMISSION_TTL_MS;
}
export function getRateLimitDecision(records, now = Date.now()) {
  const timestamps = (records || [])
    .map(record => parseTimestamp(record?.created_date))
    .filter(timestamp => timestamp !== null);
  const lastMinute = timestamps.filter(timestamp => now - timestamp < 60_000).length;
  const lastHour = timestamps.filter(timestamp => now - timestamp < 60 * 60_000).length;

  if (lastMinute >= 4) return { limited: true, retryAfterSeconds: 60 };
  if (lastHour >= 30) return { limited: true, retryAfterSeconds: 600 };
  return { limited: false, retryAfterSeconds: 0 };
}

export function getExpiredSubmissionIds(records, now = Date.now()) {
  return (records || [])
    .filter(record => ['pending', 'expired'].includes(record?.status))
    .filter(record => isSubmissionExpired(record, now))
    .map(record => record.id)
    .filter(Boolean);
}

export async function getRequestFingerprint(req) {
  const forwarded = req.headers.get('cf-connecting-ip')
    || req.headers.get('x-real-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || '';
  const userAgent = req.headers.get('user-agent') || '';
  if (!forwarded && !userAgent) return null;

  const input = new TextEncoder().encode(`${forwarded}|${userAgent}`);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}
