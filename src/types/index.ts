export interface Transaction {
  id?: number;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  description: string;
  merchant?: string;
  date: string;
  source: 'manual' | 'sms';
  smsText?: string;
  createdAt: string;
}

export interface Category {
  id?: number;
  name: string;
  icon: string;
  color: string;
  budget?: number;
}

export interface SMSResult {
  amount: number;
  type: 'expense' | 'income';
  category: string;
  description: string;
  date: string;
  merchant: string;
  raw: string;
  confidence: number;
}

export interface BudgetSummary {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export type DateRange = 'week' | 'month' | 'year' | 'all';
export type SortField = 'date' | 'amount';
export type SortDirection = 'asc' | 'desc';
