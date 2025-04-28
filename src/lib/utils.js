/**
 * Concatenates class names together with proper handling of conditional classes
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}