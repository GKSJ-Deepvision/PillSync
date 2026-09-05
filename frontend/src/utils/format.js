/** Small formatting helpers shared by the views. */

export function formatDate(value, locale = undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/** "Asha Patel" -> "Asha". Used in greetings, where a full name reads stiffly. */
export function firstName(name) {
  return name ? name.split(' ')[0] : '';
}

export function titleCase(value) {
  if (!value) return '';
  return value
    .toLowerCase()
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
