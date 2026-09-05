/** Client-side checks that mirror the backend's rules.
 *
 * These exist to give instant feedback, not to enforce anything: the server
 * validates every one of them again, because a client check can be skipped.
 */

export const MIN_PASSWORD_LENGTH = 10;

export function validateEmail(value) {
  if (!value) return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(value) {
  if (!value) return 'Choose a password.';
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (/^\d+$/.test(value)) return 'A password cannot be only numbers.';
  return null;
}

export function validateRequired(value, label) {
  return value && String(value).trim() ? null : `${label} is required.`;
}

export function validatePasswordConfirmation(password, confirmation) {
  if (!confirmation) return 'Repeat your password.';
  return password === confirmation ? null : 'The two passwords do not match.';
}

/** Run a map of field -> validator and return only the fields that failed. */
export function collectErrors(validators) {
  return Object.entries(validators).reduce((errors, [field, message]) => {
    if (message) errors[field] = message;
    return errors;
  }, {});
}
