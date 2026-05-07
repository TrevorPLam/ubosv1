import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fallback clipboard implementation for older browsers
 */
export function fallbackCopyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const textArea = document.createElement("textarea")
    textArea.value = text
    
    // Avoid scrolling to bottom
    textArea.style.top = "0"
    textArea.style.left = "0"
    textArea.style.position = "fixed"
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        resolve()
      } else {
        reject(new Error('Fallback copy failed'))
      }
    } catch (err) {
      reject(err)
    }
    
    document.body.removeChild(textArea)
  })
}

/**
 * Check if clipboard API is supported
 */
export function isClipboardSupported(): boolean {
  return typeof window !== 'undefined' && 'clipboard' in navigator
}

/**
 * Copy text to clipboard with fallback support
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!text) {
    throw new Error('Cannot copy empty text')
  }
  
  if (isClipboardSupported()) {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      // Fallback to execCommand if modern API fails
      await fallbackCopyToClipboard(text)
    }
  } else {
    // Use fallback for older browsers
    await fallbackCopyToClipboard(text)
  }
}
