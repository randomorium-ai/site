// ── Salary Negotiator — regex salary extraction ─────────────────────────────

/**
 * Attempts to extract a numeric GBP salary from free text.
 * Matches patterns like: £45,000 | £45k | 45,000 | 45k | GBP 45000 | gbp 45,000
 * Returns the extracted value or null if no match found.
 */
export function parseSalary(text: string): number | null {
  if (!text || typeof text !== "string") return null

  const normalised = text.replace(/\s+/g, " ").trim()

  // Pattern 1: £XX,XXX or £XXk
  const poundMatch = normalised.match(/£\s?([\d,]+(?:\.\d{1,2})?)\s*k?\b/i)
  if (poundMatch) {
    return normaliseSalaryString(poundMatch[1], poundMatch[0].toLowerCase().includes("k"))
  }

  // Pattern 2: GBP XX,XXX or GBP XXk
  const gbpMatch = normalised.match(/gbp\s?([\d,]+(?:\.\d{1,2})?)\s*k?\b/i)
  if (gbpMatch) {
    return normaliseSalaryString(gbpMatch[1], gbpMatch[0].toLowerCase().includes("k"))
  }

  // Pattern 3: Standalone number with comma formatting (e.g., "45,000" or "45000")
  // Only match numbers that look like salaries (5 or 6 digits, or Xk format)
  const standaloneK = normalised.match(/\b([\d,]+(?:\.\d{1,2})?)\s*k\b/i)
  if (standaloneK) {
    return normaliseSalaryString(standaloneK[1], true)
  }

  const standaloneNum = normalised.match(/\b(\d{1,3},\d{3})\b/)
  if (standaloneNum) {
    return normaliseSalaryString(standaloneNum[1], false)
  }

  // Pattern 4: Plain 5-6 digit number (e.g., "45000" or "120000")
  const plainNum = normalised.match(/\b(\d{5,6})\b/)
  if (plainNum) {
    const val = parseInt(plainNum[1], 10)
    // Sanity check: must look like a UK salary (£10k–£500k)
    if (val >= 10000 && val <= 500000) return val
  }

  return null
}

function normaliseSalaryString(numStr: string, isK: boolean): number | null {
  const cleaned = numStr.replace(/,/g, "")
  const value = parseFloat(cleaned)

  if (isNaN(value)) return null

  const salary = isK ? value * 1000 : value

  // Sanity check range
  if (salary < 5000 || salary > 1000000) return null

  return Math.round(salary)
}
