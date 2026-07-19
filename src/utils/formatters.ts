const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateShortFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const dateLongFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const monthYearFormatter = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });

export function formatCurrency(amount: number): string {
  return inrFormatter.format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return dateLongFormatter.format(date);
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return dateShortFormatter.format(date);
}

export function formatMonth(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return monthYearFormatter.format(date);
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

export function endOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
}

export function startOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export function startOfMonthFor(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

export function endOfMonthFor(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
}

export function shiftMonth(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function shortMonthLabel(d: Date): string {
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
