/**
 * Utility to format names in Title Case (first letter of every word capitalized).
 * Safe for null, undefined, empty strings, and arbitrary whitespace.
 *
 * @param {string} str
 * @returns {string}
 */
export function formatTitleCase(str) {
  if (!str || typeof str !== 'string') return str || '';
  const trimmed = str.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
