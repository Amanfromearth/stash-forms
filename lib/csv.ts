/** Escape CSV structure and prevent spreadsheet interpretation of formulas. */
export function escapeCSV(value: string): string {
  // Include control/whitespace prefixes and full-width formula characters.
  const isFormula =
    /^[\s\u0000-\u001f]*[=+@\-＝＋＠－]/u.test(value) || /^[\t\r\n]/.test(value)
  const safe = isFormula ? `'${value}` : value
  return isFormula || /[",\r\n]/.test(safe)
    ? `"${safe.replace(/"/g, '""')}"`
    : safe
}
