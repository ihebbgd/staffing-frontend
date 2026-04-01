import { HttpErrorResponse } from '@angular/common/http';

/**
 * Derive a human-readable message from any thrown value, understanding the
 * error shapes this Spring Boot backend returns (Spring's default error body
 * `{ message, error }` and Bean Validation `{ errors: [...] }`).
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error ? error.message : fallback;
  }

  // Network / server unreachable
  if (error.status === 0) {
    return 'Cannot reach the server. Check your connection and that the API is running.';
  }

  const body = error.error;
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record['message'] === 'string' && record['message']) {
      return record['message'];
    }
    const errors = record['errors'];
    if (Array.isArray(errors) && errors.length) {
      return errors
        .map((e) =>
          e && typeof e === 'object' && 'defaultMessage' in e
            ? String((e as Record<string, unknown>)['defaultMessage'])
            : String(e),
        )
        .join(', ');
    }
    if (typeof record['error'] === 'string' && record['error']) {
      return record['error'];
    }
  }

  switch (error.status) {
    case 400:
      return 'The request was invalid. Please review the form and try again.';
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return 'The requested item was not found.';
    case 409:
      return 'This conflicts with existing data.';
    default:
      return error.status >= 500 ? 'The server ran into a problem. Please try again.' : fallback;
  }
}
