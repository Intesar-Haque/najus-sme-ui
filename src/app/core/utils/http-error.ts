import { HttpErrorResponse } from '@angular/common/http';

/**
 * Fix for QA bug #50 ("no response after image size exceeds the limit").
 * See SQA-FIX.md Fix #9.
 *
 * Several dashboard forms were swallowing the real validation error and
 * always showing the same generic "Failed to ... Please try again." toast
 * — including for things like an oversized image, where Laravel already
 * sends back a specific, useful message. This pulls that message out
 * (Laravel's standard `{ message, errors }` 422 shape) and falls back to
 * the caller's generic text only for errors that aren't a validation
 * response at all (network failure, 500, etc.).
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse && typeof err.error?.message === 'string') {
    return err.error.message;
  }
  return fallback;
}
