/** Valida un código EAN-8, UPC-A, EAN-13 o GTIN-14 con su dígito verificador. */
export function isValidGtin(code: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  let sum = 0;
  for (let i = digits.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) sum += digits[i] * w;
  return (10 - (sum % 10)) % 10 === check;
}

/**
 * Acepta un código solo cuando se lee igual N veces seguidas y es válido.
 * En el iPhone del dueño hubo lecturas falsas que pasaban el dígito verificador; la repetición las filtra.
 */
export class StableReader {
  private last: string | null = null;
  private count = 0;
  private emitted: string | null = null;
  private readonly needed: number;

  constructor(needed = 3) {
    this.needed = needed;
  }

  push(code: string): string | null {
    if (!isValidGtin(code)) {
      this.last = null;
      this.count = 0;
      return null;
    }
    if (code === this.last) this.count += 1;
    else {
      this.last = code;
      this.count = 1;
    }
    if (this.count >= this.needed && this.emitted !== code) {
      this.emitted = code;
      return code;
    }
    return null;
  }

  reset(): void {
    this.last = null;
    this.count = 0;
    this.emitted = null;
  }
}
