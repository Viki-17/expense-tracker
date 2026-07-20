import type { SMSResult } from '../types';

function formatLocalDate(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function cleanMerchant(name: string): string {
  return name.replace(/[.,;:'"!?]+$/, '').trim();
}

interface SMSRule {
  name: string;
  patterns: RegExp[];
  category: string;
  type: 'expense' | 'income' | 'neutral';
}

const BANK_RULES: SMSRule[] = [
  {
    name: 'Salary Credit',
    patterns: [
      /(?:salary|stipend|payslip)/i,
    ],
    category: 'Salary',
    type: 'income',
  },
  {
    name: 'NACH / Standing Instruction',
    patterns: [
      /NACH\s+debit/i,
      /standing\s+instruction/i,
      /mandate\s+debit/i,
      /ECS\s+(?:debit|payment)/i,
      /auto\s*debit/i,
    ],
    category: 'Bills & Utilities',
    type: 'expense',
  },
  {
    name: 'EMI / Loan',
    patterns: [
      /(?:emi|loan|interest|installment|repayment|finance)/i,
    ],
    category: 'Bills & Utilities',
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
    name: 'Food / Restaurant',
    patterns: [
      /(?:zomato|swiggy|restaurant|snacks|food|cafe|hotel.*?(?:meal|dining|food|restaurant)|bake|sweet|dhaba|bar|pub)/i,
    ],
    category: 'Food & Dining',
    type: 'expense',
  },
  {
    name: 'Grocery',
    patterns: [
      /(?:grocery|supermarket|big\s*basket|blinkit|zepto|instamart|dmart|more\s*store|reliance\s*fresh|kirana|mart\b)/i,
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
    name: 'ATM Withdrawal',
    patterns: [
      /ATM.*?(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
      /(?:withdraw|withdrawn|cash\s*withdrawal).*?(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
    ],
    category: 'Bills & Utilities',
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
    name: 'Card Payment',
    patterns: [
      /(?:card\s*(?:no|number)\s*(?:\*+|\d+)?\s*|credit\s*card|debit\s*card).*?(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*.*?(?:at|on)\s+(.+?)(?:\s+(?:on|at|\.|Ref|$))/i,
      /(?:swiped\s*(?:for|at)|transaction\s*(?:at|on))\s*(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*(?:at|on)\s+(.+?)(?:\s+(?:on|at|\.|Ref|$))/i,
    ],
    category: 'Shopping',
    type: 'expense',
  },
  {
    name: 'Provident Fund / EPF',
    patterns: [
      /(?:provident\s*fund|EPF|PF\s*(?:account|balance|contribution))/i,
      /contribution.*?due\s*month/i,
    ],
    category: 'Investment',
    type: 'income',
  },
  {
    name: 'Generic Debit/Credit',
    patterns: [
      /(?:debited|debit\b|spent|paid|withdrawn|purchase(?:d)?\s+(?:at|of|from)?)\s*(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
      /(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*(?:debited|debit\b|spent|paid|deducted)/i,
      /(?:credited|received|added|deposited)\s*(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
      /(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*(?:credited|received|added)/i,
    ],
    category: 'Other',
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

  const NON_TXN_PATTERNS = [
    /\bCONGRATULATIONS\b/,
    /you\s*(?:'ve|have)\s*unlocked/i,
    /\b(?:click|tap)\s+here\b/i,
    /\blucky\s+draw\b/i,
    /\b(?:earn|get|win|avail)\s+(?:flat\s+)?(?:Rs\.?|INR)?\s*[\d,]+\s*(?:cashback|reward)/i,
    /\bcashback\s+on\s+your\b/i,
    /\b(?:offer|promo)\s+(?:ends|valid|today)/i,
    /\bapply\s+now\b/i,
    /\b(?:short\s*url|bit\.ly|tinyurl|goo\.gl|airtel\.in)\b/i,
    /\b(?:scheduled|routine)\s+maintenance\b/i,
    /\bservices?\s+will\s+not\s+be\s+available\b/i,
    /\bregret\s+(?:the\s+)?inconvenience\b/i,
    /\boutage\b/i,
    /\b(?:net\s*banking|mobile\s*banking)\s*(?:is|will|has)\s+(?:down|unavailable)\b/i,
    /\byour\s+(?:account|card)\s+will\s+be\s+(?:debited|charged)\s/i,
    /\bupdate\s+your\s+(?:kyc|pan|aadhaar)\b/i,
    /\bstatement\s+(?:is\s+(?:sent|generated|ready|issued|prepared)|was\s+(?:sent|generated|ready|issued|prepared))\b/i,
    /\btotal\s+(?:of|amount)?\s*(?:Rs\.?|INR)?\s*[\d,]+.*?(?:or\s+minimum|due\s+by)\b/i,
  ];

  if (NON_TXN_PATTERNS.some((p) => p.test(cleaned))) {
    return null;
  }

  const TXN_KEYWORDS = /\b(?:debit(?:ed)?|credit(?:ed)?|spent|paid|withdr(?:awn|aw)|purchased?|deposited?|neft|imps|rtgs|upi|balance|avl\s*bal|available|sent|received|transferred|ref\s*no|txn|transaction|emi|recharge|bill\s*pay|payment)\b/i;
  const hasCurrency = /(?:Rs\.?|INR)\s*[\d,]+/i;

  if (!TXN_KEYWORDS.test(cleaned) && !hasCurrency.test(cleaned)) {
    return null;
  }

  let amount: number | null = null;
  let type: 'expense' | 'income' | 'neutral' = 'expense';
  let category = 'Other';
  let merchant = '';
  let confidence = 0;

  // Extract amount - look for common Indian bank SMS amount patterns
  // Strip available balance/limit text to avoid picking up non-transaction amounts
  const cleanedForAmount = cleaned
    .replace(/(?:Avl|Available)\s+(?:Balance|Limit|Bal)(?:\s*is)?\s*:?\s*(?:Rs\.?|INR|USD)?\s*[\d,]+\.?\d*.*$/i, '')
    .trim();
  const amountPatterns = [
    /(?:contribution|deposit|premium|installment)\s+(?:of|for)?\s*(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
    /(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:Rs\.?|INR)/i,
    /(?:amount\s*(?:of\s*)?|amt\.?\s*)(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
    /(?:USD|USD\.?)\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.\d{2})\b/,
  ];

  let amountFrom = cleanedForAmount;

  for (const pattern of amountPatterns) {
    const match = amountFrom.match(pattern);
    if (match) {
      const amt = parseFloat(match[1].replace(/,/g, ''));
      if (amt > 0) {
        const afterMatch = amountFrom.substring(match.index! + match[0].length);
        if (/^\s*[-/\.]\s*\d{2,4}\b/.test(afterMatch)) {
          continue;
        }
        amount = amt;
        break;
      }
    }
  }

  if (!amount || amount <= 0) return null;

  // Check for declined/failed/cancelled transactions before debit/credit detection
  const isNeutral = /(?:declined|not\s+(?:processed|completed|successful)|rejected|cancell?ed|unsuccessful|failed|not\s+honou?red|transaction\s+(?:could|was)\s+not|per\s+txn\s+limit)/i.test(cleaned);

  // Determine if debit or credit — detect early so categorization doesn't override
  const isDebit = /(?:debit(?:\b|ed|s?\s)|spent|paid|withdrawn|deducted|purchase|nach)/i.test(cleaned);
  const isCredit = /(?:credited|received|added|deposited|salary|stipend|refund|cashback)/i.test(cleaned);
  let typeExplicit = false;

  if (isNeutral) {
    type = 'neutral';
    typeExplicit = true;
    confidence += 15;
    // Still categorize and extract merchant for visibility
    for (const rule of BANK_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(cleaned)) {
          category = rule.category;
          confidence += 25;
          break;
        }
      }
      if (confidence >= 40) break;
    }
  } else {
    // Check debit keywords first — many Indian SMS mention beneficiary "credited" in debit context
    if (isDebit && !isCredit) {
      type = 'expense';
      typeExplicit = true;
      confidence += 20;
    } else if (isCredit && !isDebit) {
      type = 'income';
      typeExplicit = true;
      confidence += 20;
    } else if (isDebit) {
      // Both debit and credit keywords found → prefer debit (beneficiary "credited" is not user income)
      type = 'expense';
      typeExplicit = true;
      confidence += 20;
    } else if (isCredit) {
      type = 'income';
      typeExplicit = true;
      confidence += 20;
    }
  }

  // Categorize using rules (skip for neutral — already categorized above)
  if (!isNeutral) {
    for (const rule of BANK_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(cleaned)) {
          if (rule.type !== undefined && !typeExplicit) type = rule.type;
          category = rule.category;
          confidence += 25;
          break;
        }
      }
      if (confidence >= 25) break;
    }
  }

  // Extract merchant name
  for (const [pattern, name] of MERCHANT_PATTERNS) {
    if (pattern.test(cleaned)) {
      merchant = name;
      confidence += 15;
      break;
    }
  }

  // Extract merchant from UPI/P2M reference (e.g., UPI/P2M/520087032006/DK SNACKS)
  if (!merchant) {
    const upiRefMatch = cleaned.match(/(?:UPI|VPA)[\s:\-/]+(?:P2M|P2P|P2A)?[\s:\-/]*\d+[\s:\-/]+([A-Za-z][A-Za-z0-9\s&.\-_@]{2,30}?)(?:\s+(?:on|at|for|Ref|UPI|Not|SMS|Call|\.|,|$)|$)/i);
    if (upiRefMatch) {
      merchant = cleanMerchant(upiRefMatch[1]);
      if (merchant.length >= 2) confidence += 10;
    }
  }

  // Extract merchant from "at/to/via/from/on/towards <merchant>" patterns
  if (!merchant) {
    const merchantMatch = cleaned.match(
      /(?:at|to|via|from|towards)\s+([A-Za-z][A-Za-z0-9\s&.\-_'()]{2,30}?)(?:\s+(?:on|at|for|Ref|UPI|Not|SMS|Call|Avl|\.(?:\s|$)|$))/i
    );
    if (merchantMatch) {
      const candidate = cleanMerchant(merchantMatch[1]);
      if (candidate.length >= 2 && !/^\d{1,2}[-/ ]/.test(candidate)) {
        merchant = candidate;
        confidence += 10;
      }
    }
  }

  // Extract merchant from "on <merchant>" when preceded by a year/date (e.g., "...on 11-Jul-26 on MOON MART")
  if (!merchant) {
    const onMerchantMatch = cleaned.match(/(?:'?\d{2}|20\d{2})\s+on\s+([A-Za-z][A-Za-z0-9\s&.\-_'()]{2,30}?)(?:\s+(?:Avl|avl|Not|SMS|Call|on|at|for|Ref|UPI|\.(?:\s|$)|$))/i);
    if (onMerchantMatch) {
      const candidate = cleanMerchant(onMerchantMatch[1]);
      if (candidate.length >= 2) {
        merchant = candidate;
        confidence += 10;
      }
    }
  }

  // Extract payee name from "X credited" in debit context (e.g., "...debited for Rs X... ; DIVYA BHARATHII credited")
  if (!merchant && type === 'expense') {
    const payeeMatch = cleaned.match(/([A-Za-z][A-Za-z0-9\s&.\-_'()]{3,25})\s+(?:credited|received|beneficiary)/i);
    if (payeeMatch) {
      merchant = cleanMerchant(payeeMatch[1]);
      confidence += 5;
    }
  }

  // Extract from UPI ID (e.g., UPI:640023505610 or upi://...)
  if (!merchant) {
    const upiIdMatch = cleaned.match(/(?:UPI|upi)[\s:\-/]+([A-Za-z][A-Za-z0-9@.\-_]{4,30})/i);
    if (upiIdMatch && !/^\d+$/.test(upiIdMatch[1])) {
      merchant = upiIdMatch[1].trim();
    }
  }

  // Try to extract merchant from "at <merchant>" or "to <merchant>" patterns (original fallback, less strict)
  if (!merchant) {
    const merchantMatch = cleaned.match(/(?:at|to|via|from)\s+([A-Za-z0-9\s&.]+?)(?:\s+(?:on|at|for|Ref|UPI|\.(?:\s|$)|$))/i);
    if (merchantMatch) {
      const candidate = merchantMatch[1].trim();
      if (candidate.length <= 25 && !/^\d{1,2}[-/ ]/.test(candidate) && candidate.length > 1) {
        merchant = candidate;
      }
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

      return formatLocalDate(year, month, day);
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
