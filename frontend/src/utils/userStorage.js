/**
 * User-Scoped LocalStorage Management
 * Guarantees complete data isolation between Patient and Caregiver accounts.
 * When a new patient signs in, their medication, reminder, and check-in records start fresh at 0.
 */

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading current user:', err);
  }
  return null;
}

export function getCurrentUserKey() {
  const user = getCurrentUser();
  if (user) {
    if (user.email) {
      return user.email
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
    }
    if (user.id) {
      return String(user.id);
    }
  }
  return 'guest';
}

export function getUserStorageKey(namespace) {
  const userKey = getCurrentUserKey();
  return `${namespace}_${userKey}`;
}

export function getScopedStorage(namespace, defaultValue = []) {
  try {
    const key = getUserStorageKey(namespace);
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch (err) {
    console.error(`Error reading ${namespace} for user:`, err);
  }
  return defaultValue;
}

export function setScopedStorage(namespace, value) {
  try {
    const key = getUserStorageKey(namespace);
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${namespace} for user:`, err);
  }
}

export function removeScopedStorage(namespace) {
  try {
    const key = getUserStorageKey(namespace);
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Error removing ${namespace} for user:`, err);
  }
}

export function getScopedStorageForUser(userIdentifier, namespace, defaultValue = []) {
  try {
    if (!userIdentifier) return defaultValue;
    const cleanKey = String(userIdentifier)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const key = `${namespace}_${cleanKey}`;
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading ${namespace} for user ${userIdentifier}:`, err);
  }
  return defaultValue;
}
