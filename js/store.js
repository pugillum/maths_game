const STORAGE_KEY = "mathsGame.enabledNumbers";
export const ALL_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const MIN_ENABLED = 2;

export function getEnabledNumbers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ALL_NUMBERS.slice();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return ALL_NUMBERS.slice();

    const numbers = parsed.filter((n) => ALL_NUMBERS.includes(n));
    return numbers.length >= MIN_ENABLED ? numbers : ALL_NUMBERS.slice();
  } catch (e) {
    return ALL_NUMBERS.slice();
  }
}

export function setEnabledNumbers(numbers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(numbers));
}
