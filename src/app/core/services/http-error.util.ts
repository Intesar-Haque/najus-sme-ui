/**
 * Picks a user-safe error message out of a failed HttpClient request.
 *
 * Every API call in this app used to do `err.error?.message ?? fallback`
 * directly, which trusts *any* string the server sends back — including
 * Laravel's own framework-level messages when something is badly
 * misconfigured, e.g. "The route api/auth/request-otp could not be found."
 * on a 404 from routing itself (not from the controller), or a raw
 * "Server Error" page's text on a 500. Those aren't things a member should
 * ever see; they're internal plumbing that leaked through because the
 * shape looks identical to a real, intentional error response like
 * `{"message": "Member not found. Please check and try again."}`.
 *
 * There's no reliable field to tell those apart from the JSON alone — both
 * are `{"message": "..."}` on a 404 — so this checks the message text
 * itself against the fixed set of strings Laravel's own exception handler
 * produces, and against transport-level failures (no response at all, 5xx)
 * that never carry an app-authored message to begin with.
 */
const FRAMEWORK_ERROR_PATTERNS: RegExp[] = [
  /^The route .* could not be found\.?$/i,     // routing 404 (missing/uncached route)
  /^The GET method is not supported/i,         // routing 405
  /^The POST method is not supported/i,
  /^Server Error$/i,                           // generic 500 fallback page
  /^CSRF token mismatch/i,                     // 419
  /^Service Unavailable/i,                     // 503 (maintenance mode)
];

export function friendlyApiError(err: any, fallback: string): string {
  const status  = err?.status;
  const message = err?.error?.message;

  // No response reached the app at all (network down, CORS failure, DNS,
  // timeout) — status 0, or a 5xx that's infrastructure, not app logic.
  if (status === 0 || status >= 500) {
    return fallback;
  }

  if (typeof message !== 'string' || message.trim() === '') {
    return fallback;
  }

  if (FRAMEWORK_ERROR_PATTERNS.some(p => p.test(message.trim()))) {
    return fallback;
  }

  return message;
}
