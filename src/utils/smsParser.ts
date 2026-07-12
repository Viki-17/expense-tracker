import type { SMSResult } from '../types';

interface SMSRule {
  name: string;
  patterns: RegExp[];
  category: string;
  type: 'expense' | 'income';
}

const BANK_RULES: SMSRule[] = [
  {
    name: 'Generic Debit/Credit',
    patterns: [
      /(?:debited|spent|paid|withdrawn|purchase(?:d)?\s+(?:at|of|from)?)\s*(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
      /(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*(?:debited|spent|paid|deducted)/i,
      /(?:credited|received|added|deposited)\s*(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
      /(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*(?:credited|received|added)/i,
    ],
    category: 'Other',
    type: 'expense',
  },
  {
    name: 'UPI Payment',
    patterns: [
      /UPI.*?(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*.*?(?:to|at)\s+(.+?)(?:\s+(?:on|at|ref|Ref|UPI|\.|$))/i,
      /(?:sent|paid|transferred)\s*(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*(?:to|via)\s+(.+?)(?:\s+(?:on|at|from|\.|$))/i,
      /(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*.*?(?:sent|paid)\s*(?:to|via|using)\s+(.+?)(?:\s+(?:on|at|from|\.|Ref|$))/i,
    ],
    category: 'Other',
    type: 'expense',
  },
  {
    name: 'UPI Credit',
    patterns: [
      /UPI.*?(?:received|credited).*?(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
      /(?:received|credited)\s*(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*(?:from|via)\s+(.+?)(?:\s+(?:on|at|UPI|\.|Ref|$))/i,
    ],
    category: 'Other',
    type: 'income',
  },
  {
    name: 'Card Payment',
    patterns: [
      /(?:card\s*(?:no|number)\s*(?:\*+|\d+)?\s*|credit\s*card|debit\s*card).*?(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*.*?(?:at|on)\s+(.+?)(?:\s+(?:on|at|\.|Ref|$))/i,
      /(?:swiped\s*(?:for|at)|transaction\s*(?:at|on))\s*(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*(?:at|on)\s+(.+?)(?:\s+(?:on|at|\.|Ref|$))/i,
    ],
    category: 'Shopping',
    type: 'expense',
  },
  {
    name: 'ATM Withdrawal',
    patterns: [
      /ATM.*?(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
      /(?:withdraw|withdrawn|cash\s*withdrawal).*?(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
    ],
    category: 'Bills & Utilities',
    type: 'expense',
  },
  {
    name: 'Food / Restaurant',
    patterns: [
      /(?:zomato|swiggy|restaurant|food|cafe|hotel.*?(?:meal|dining|food|restaurant))/i,
    ],
    category: 'Food & Dining',
    type: 'expense',
  },
  {
    name: 'Grocery',
    patterns: [
      /(?:grocery|supermarket|big\s*basket|blinkit|zepto|instamart|dmart|more\s*store|reliance\s*fresh)/i,
    ],
    category: 'Groceries',
    type: 'expense',
  },
  {
    name: 'Transport',
    patterns: [
      /(?:uber|ola|rapido|metro|bus|train|flight|petrol|fuel|diesel|parking|toll)/i,
    ],
    category: 'Transport',
    type: 'expense',
  },
  {
    name: 'Entertainment',
    patterns: [
      /(?:netflix|amazon\s*prime|hotstar|disney\+|youtube|spotify|movie|cinema|bookmyshow|gaming)/i,
    ],
    category: 'Entertainment',
    type: 'expense',
  },
  {
    name: 'Shopping',
    patterns: [
      /(?:amazon|flipkart|myntra|ajio|meesho|nykaa|shopping|mall|purchase)/i,
    ],
    category: 'Shopping',
    type: 'expense',
  },
  {
    name: 'Bills',
    patterns: [
      /(?:electricity|bill|recharge|mobile|broadband|wifi|dth|gas\s*(?:bill|connection)|water)/i,
    ],
    category: 'Bills & Utilities',
    type: 'expense',
  },
  {
    name: 'Salary Credit',
    patterns: [
      /(?:salary|stipend|payslip)/i,
    ],
    category: 'Salary',
    type: 'income',
  },
  {
    name: 'EMI / Loan',
    patterns: [
      /(?:emi|loan|interest|installment|repayment|finance)/i,
    ],
    category: 'Bills & Utilities',
    type: 'expense',
  },
];

const MERCHANT_PATTERNS: [RegExp, string][] = [
  [/amazon/i, 'Amazon'],
  [/flipkart/i, 'Flipkart'],
  [/zomato/i, 'Zomato'],
  [/swiggy/i, 'Swiggy'],
  [/uber/i, 'Uber'],
  [/ola/i, 'Ola'],
  [/netflix/i, 'Netflix'],
  [/big\s*basket/i, 'BigBasket'],
  [/blinkit/i, 'Blinkit'],
  [/zepto/i, 'Zepto'],
  [/myntra/i, 'Myntra'],
  [/jiomart/i, 'JioMart'],
  [/dmart/i, 'DMart'],
];

export function parseSMS(message: string): SMSResult | null {
  const cleaned = message.replace(/\s+/g, ' ').trim();

  let amount: number | null = null;
  let type: 'expense' | 'income' = 'expense';
  let category = 'Other';
  let merchant = '';
  let confidence = 0;

  // Extract amount - look for common Indian bank SMS amount patterns
  const amountPatterns = [
    /(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:Rs\.?|INR)/i,
    /(?:amount\s*(?:of\s*)?|amt\.?\s*)(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d{2})\b/,
  ];

  for (const pattern of amountPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const amt = parseFloat(match[1].replace(/,/g, ''));
      if (amt > 0) {
        amount = amt;
        break;
      }
    }
  }

  if (!amount) {
    // Try matching any number that looks like an amount
    const genericMatch = cleaned.match(/([\d,]+\.?\d{2})/);
    if (genericMatch) {
      amount = parseFloat(genericMatch[1].replace(/,/g, ''));
    }
  }

  if (!amount || amount <= 0) return null;

  // Determine if debit or credit
  if (/(?:credited|received|added|deposited|salary|stipend|refund|cashback)/i.test(cleaned)) {
    type = 'income';
    confidence += 20;
  } else if (/(?:debited|spent|paid|withdrawn|deducted|purchase)/i.test(cleaned)) {
    type = 'expense';
    confidence += 20;
  }

  // Categorize using rules
  for (const rule of BANK_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(cleaned)) {
        if (rule.type !== undefined) type = rule.type;
        category = rule.category;
        confidence += 25;
        break;
      }
    }
    if (confidence >= 25) break;
  }

  // Extract merchant name
  for (const [pattern, name] of MERCHANT_PATTERNS) {
    if (pattern.test(cleaned)) {
      merchant = name;
      confidence += 15;
      break;
    }
  }

  // Try to extract merchant from "at <merchant>" or "to <merchant>" patterns
  if (!merchant) {
    const merchantMatch = cleaned.match(/(?:at|to|via|from)\s+([A-Za-z0-9\s&.]+?)(?:\s+(?:on|at|for|Ref|UPI|\.(?:\s|$)|$))/i);
    if (merchantMatch) {
      merchant = merchantMatch[1].trim();
      if (merchant.length > 25) merchant = merchant.slice(0, 25);
    }
  }

  // Extract date
  const datePatterns = [
    /(?:on|dated?|date|as\s*of)\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i,
    /(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/,
    /(\d{2}[-/\.][A-Za-z]{3}[-/\.]\d{2,4})/i,
  ];

  let date = new Date().toISOString().split('T')[0];
  for (const pattern of datePatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const parsed = parseDate(match[1]);
      if (parsed) {
        date = parsed;
        confidence += 10;
        break;
      }
    }
  }

  // Build description
  let description = merchant || category;
  if (merchant && category !== 'Other') {
    description = `${merchant} - ${category}`;
  }

  // Cap confidence
  confidence = Math.min(confidence, 95);

  return { amount, type, category, description, date, merchant, raw: message, confidence };
}

function parseDate(dateStr: string): string | null {
  try {
    const cleaned = dateStr.replace(/[\/-]/g, '-');
    const parts = cleaned.split('-');

    if (parts.length === 3) {
      let day: number, month: number, year: number;

      if (parts[0].length === 4) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
      } else {
        day = parseInt(parts[0]);
        month = isNaN(parseInt(parts[1])) ? getMonthNumber(parts[1]) : parseInt(parts[1]);
        year = parseInt(parts[2]);
      }

      if (year < 100) year += 2000;
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;

      const d = new Date(year, month - 1, day);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0];
    }
  } catch {
    return null;
  }
  return null;
}

function getMonthNumber(month: string): number {
  const months: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  return months[month.toLowerCase()] || 1;
}

export function parseMultipleSMS(messages: string[]): SMSResult[] {
  return messages
    .map((msg) => parseSMS(msg))
    .filter((result): result is SMSResult => result !== null)
    .sort((a, b) => b.confidence - a.confidence);
}
