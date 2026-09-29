/** Local device identity: the pairing code that links a phone to this TV. */

const CODE_KEY = "curran.pairCode";
const NAME_KEY = "curran.deviceName";
const LITE_KEY = "curran.liteMode";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function makeCode(length = 6) {
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

export function readPairCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CODE_KEY);
}

export function ensurePairCode(): string {
  const existing = readPairCode();
  if (existing) return existing;
  const code = makeCode();
  localStorage.setItem(CODE_KEY, code);
  return code;
}

export function savePairCode(code: string) {
  localStorage.setItem(CODE_KEY, code.toUpperCase());
}

export function readDeviceName(): string {
  if (typeof window === "undefined") return "Curran TV";
  return localStorage.getItem(NAME_KEY) || "Curran TV";
}

export function saveDeviceName(name: string) {
  localStorage.setItem(NAME_KEY, name);
}

export function readLiteMode(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(LITE_KEY);
  if (stored !== null) return stored === "true";
  // Default on for low-powered devices such as the Raspberry Pi.
  if (/aarch64|armv7|armv8|Raspbian/i.test(navigator.userAgent)) return true;
  const cores = navigator.hardwareConcurrency ?? 4;
  return cores <= 4;
}

export function saveLiteMode(on: boolean) {
  localStorage.setItem(LITE_KEY, String(on));
}
