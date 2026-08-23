export function normalizeMalaysianMobile(value: string): string {
  const digits = value.replace(/[^\d+]/g, "");
  let num = digits.replace(/^\+/, "");
  if (num.startsWith("60")) num = num.slice(2);
  if (num.startsWith("0")) num = num.slice(1);
  return "0" + num;
}

export function isValidMalaysianMobile(value: string): boolean {
  return /^01[0-9]{8,9}$/.test(normalizeMalaysianMobile(value));
}
