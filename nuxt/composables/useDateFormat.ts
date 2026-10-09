const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/

// Explicit locale so server and client render identical strings.
const hoursFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const limitFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

interface DateParts {
  year: number
  month: number
  day: number
}

function parseIso(iso: string): DateParts | null {
  const match = ISO_DATE.exec(iso)
  if (!match) return null
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return { year: Number(match[1]), month, day: Number(match[3]) }
}

/**
 * Display helpers for ISO `YYYY-MM-DD` strings. Dates are never parsed through
 * `Date`, so there is no timezone drift, and none of these derive "today".
 */
export const useDateFormat = () => {
  /** "2026-05-29" -> "29 May 2026" */
  function formatLongDate(iso: string): string {
    const p = parseIso(iso)
    return p ? `${p.day} ${MONTHS_SHORT[p.month - 1]} ${p.year}` : iso
  }

  /** "2026-05-29" -> 29 */
  function dayOfMonth(iso: string): number {
    return parseIso(iso)?.day ?? 0
  }

  /** "2026-05-29" -> "May" */
  function monthShort(iso: string): string {
    const p = parseIso(iso)
    return p ? MONTHS_SHORT[p.month - 1]! : ''
  }

  /** "2026-05-29" -> 5 */
  function monthNumber(iso: string): number {
    return parseIso(iso)?.month ?? 0
  }

  /** 1444.5 -> "1,444.5" (always one decimal) */
  function formatHours(value: number): string {
    return hoursFormat.format(value)
  }

  /** 8 -> "8", 12.5 -> "12.5" */
  function formatLimit(value: number): string {
    return limitFormat.format(value)
  }

  return { formatLongDate, dayOfMonth, monthShort, monthNumber, formatHours, formatLimit }
}
