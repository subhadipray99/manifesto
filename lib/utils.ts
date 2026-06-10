import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Given any CSS hex color (e.g. "#a8e6cf" or "#1a1a2e"), returns "#000000"
 * or "#ffffff" depending on which has better WCAG contrast against the bg.
 */
export function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "")
  if (hex.length !== 3 && hex.length !== 6) return "#000000"
  const full = hex.length === 3
    ? hex.split("").map((c) => c + c).join("")
    : hex
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  // linearise sRGB
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  // WCAG relative luminance threshold
  return L > 0.179 ? "#000000" : "#ffffff"
}
