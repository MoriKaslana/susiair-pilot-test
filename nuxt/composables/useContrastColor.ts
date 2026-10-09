export type TextTone = 'light' | 'dark'

// Relative luminance of the navy design token; kept as a number so no hex lives here.
const NAVY_LUMINANCE = 0.0147

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

function channelToLinear(channel: number): number {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance of a `#RGB` / `#RRGGBB` colour, or null if it can't be parsed. */
function luminanceOf(color: string): number | null {
  const match = HEX_COLOR.exec(color.trim())
  if (!match) return null
  let hex = match[1]!
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  const r = channelToLinear(parseInt(hex.slice(0, 2), 16))
  const g = channelToLinear(parseInt(hex.slice(2, 4), 16))
  const b = channelToLinear(parseInt(hex.slice(4, 6), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Picks the more readable text for an arbitrary background: `light` (white) text
 * on dark colours, `dark` (navy) text on light ones. The caller maps the tone to
 * a design token, e.g. via a CSS class.
 */
export const useContrastColor = () => {
  function textTone(background: string): TextTone {
    const luminance = luminanceOf(background)
    if (luminance === null) return 'dark'
    const contrastWithWhite = 1.05 / (luminance + 0.05)
    const contrastWithNavy = (luminance + 0.05) / (NAVY_LUMINANCE + 0.05)
    return contrastWithWhite > contrastWithNavy ? 'light' : 'dark'
  }

  return { textTone }
}
