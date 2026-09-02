export function isValidIranianMobile(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  const patterns = [/^09[0-9]{9}$/, /^\+989[0-9]{9}$/, /^00989[0-9]{9}$/, /^989[0-9]{9}$/];

  return patterns.some((pattern) => pattern.test(cleanPhone));
}

export function normalizeIranianMobile(phone: string): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  if (/^09[0-9]{9}$/.test(cleanPhone)) {
    return cleanPhone;
  }
  if (/^\+989[0-9]{9}$/.test(cleanPhone)) {
    return `0${cleanPhone.substring(3)}`;
  }
  if (/^00989[0-9]{9}$/.test(cleanPhone)) {
    return `0${cleanPhone.substring(4)}`;
  }
  if (/^989[0-9]{9}$/.test(cleanPhone)) {
    return `0${cleanPhone.substring(2)}`;
  }

  return null;
}
