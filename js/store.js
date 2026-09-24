export const ALL_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const MIN_ENABLED = 2;

export function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function todayString() {
  return formatDate(new Date());
}
