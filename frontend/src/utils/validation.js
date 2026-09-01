/**
 * Validation utility functions for PillSync
 */

/**
 * Validates email format using safe, linear string inspection without backtracking
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  const dotIndex = trimmed.lastIndexOf('.');
  
  return (
    atIndex > 0 &&
    dotIndex > atIndex + 1 &&
    dotIndex < trimmed.length - 1 &&
    !trimmed.includes(' ')
  );
}
