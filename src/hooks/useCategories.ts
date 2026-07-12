import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_CATEGORIES } from '../db';
import type { Category } from '../types';

export function useCategories() {
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const addCategory = async (c: Omit<Category, 'id'>) => {
    await db.categories.add(c);
  };

  const updateCategory = async (id: number, updates: Partial<Category>) => {
    await db.categories.update(id, updates);
  };

  const deleteCategory = async (id: number) => {
    const cat = await db.categories.get(id);
    if (!cat) return;
    const defaultCat = DEFAULT_CATEGORIES.find((d) => d.name === cat.name);
    if (defaultCat) return; // Don't delete default categories
    await db.categories.delete(id);
  };

  const getCategory = (name: string): Category | undefined => {
    return categories.find((c) => c.name === name) || DEFAULT_CATEGORIES.find((c) => c.name === name);
  };

  return { categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES, addCategory, updateCategory, deleteCategory, getCategory };
}
