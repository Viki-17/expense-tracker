import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_CATEGORIES } from '../db';
import type { Category } from '../types';

export function useCategories() {
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const addCategory = useCallback(async (c: Omit<Category, 'id'>) => {
    await db.categories.add(c);
  }, []);

  const updateCategory = useCallback(async (id: number, updates: Partial<Category>) => {
    await db.categories.update(id, updates);
  }, []);

  const deleteCategory = useCallback(async (id: number) => {
    const cat = await db.categories.get(id);
    if (!cat) return;
    const defaultCat = DEFAULT_CATEGORIES.find((d) => d.name === cat.name);
    if (defaultCat) return;
    await db.categories.delete(id);
  }, []);

  const getCategory = useCallback((name: string): Category | undefined => {
    return categories.find((c) => c.name === name) || DEFAULT_CATEGORIES.find((c) => c.name === name);
  }, [categories]);

  return { categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES, addCategory, updateCategory, deleteCategory, getCategory };
}
