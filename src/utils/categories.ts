import type { Category } from '../types';

export function categoryInitial(name: string): string {
  if (!name) return '?';
  const parts = name.replace(/[^a-zA-Z &]/g, '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function categoryColor(category: Category | undefined, fallback = '#64748b'): string {
  return category?.color || fallback;
}

export function getCategoryMeta(categories: Category[]): Map<string, Category> {
  return new Map(categories.map((c) => [c.name, c]));
}