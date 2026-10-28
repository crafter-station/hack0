/** `?pagina=2` as a zero-based page; anything invalid is the first page. */
export function pastPage(searchParams: { pagina?: string }) {
  const n = Number(searchParams.pagina);
  return Number.isInteger(n) && n > 1 ? n - 1 : 0;
}
