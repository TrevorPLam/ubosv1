/**
 * @file        artifacts/ai-command-center/src/lib/utils.ts
 * @module      Utilities / General
 * @purpose     General utility functions for CSS classes, formatting, and clipboard operations
 *
 * @ai_instructions
 *   - Must use clsx and tailwind-merge for CSS class utilities
 *   - Must provide fallback clipboard implementation for older browsers
 *   - Must format conversations to JSON, Markdown, and plain text
 *   - DO NOT modify conversation formatting without updating export features
 *
 * @exports     cn, formatToJSON, formatToMarkdown, formatToText, fallbackCopyToClipboard, isClipboardSupported, copyToClipboard
 * @imports     clsx, tailwind-merge, @/api/chat
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Message, Thread } from "@/api/chat"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format conversation to JSON string
 */
export function formatToJSON(thread: Thread): string {
  return JSON.stringify(thread, null, 2)
}

/**
 * Format conversation to Markdown string
 */
export function formatToMarkdown(thread: Thread): string {
  const header = `# Conversation: ${thread.title}\nProject: ${thread.projectId}\nDate: ${new Date().toLocaleDateString()}\n\n---\n\n`
  
  const content = thread.messages.map(msg => {
    const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1)
    const agent = msg.agentId ? ` (${msg.agentId})` : ""
    const timestamp = new Date(msg.timestamp).toLocaleString()
    
    let message = `### ${role}${agent} - ${timestamp}\n\n${msg.content}\n\n`
    
    if (msg.attachments && msg.attachments.length > 0) {
      message += `**Attachments:**\n`
      msg.attachments.forEach(att => {
        message += `- ${att.name} (${att.type})\n`
      })
      message += `\n`
    }
    
    if (msg.toolCalls) {
      message += `**Tool Calls:**\n`
      msg.toolCalls.forEach(tc => {
        message += `> **${tc.name}**: \`${tc.args}\`\n`
      })
      message += `\n`
    }
    
    return message
  }).join("---\n\n")
  
  return header + content
}

/**
 * Format conversation to Plain Text string
 */
export function formatToText(thread: Thread): string {
  const header = `Conversation: ${thread.title}\nProject: ${thread.projectId}\nDate: ${new Date().toLocaleDateString()}\n${"=".repeat(50)}\n\n`
  
  const content = thread.messages.map(msg => {
    const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1)
    const agent = msg.agentId ? ` (${msg.agentId})` : ""
    const timestamp = new Date(msg.timestamp).toLocaleString()
    
    let message = `[${timestamp}] ${role}${agent}:\n${msg.content}\n`
    
    if (msg.attachments && msg.attachments.length > 0) {
      message += `Attachments: ${msg.attachments.map(a => a.name).join(", ")}\n`
    }
    
    return message
  }).join("\n" + "-".repeat(30) + "\n\n")
  
  return header + content
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
