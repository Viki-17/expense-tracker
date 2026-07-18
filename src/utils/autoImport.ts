const STORAGE_KEY = 'smsAutoImportMerchants';

export function getAutoImportMerchants(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addAutoImportMerchant(merchant: string): void {
  const list = getAutoImportMerchants();
  const normalized = merchant.trim().toLowerCase();
  if (normalized && !list.map((m) => m.toLowerCase()).includes(normalized)) {
    list.push(merchant.trim());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

export function removeAutoImportMerchant(merchant: string): void {
  const list = getAutoImportMerchants();
  const filtered = list.filter((m) => m.toLowerCase() !== merchant.toLowerCase());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function isAutoImportMerchant(merchant: string): boolean {
  return getAutoImportMerchants().some((m) => m.toLowerCase() === merchant.toLowerCase());
}
