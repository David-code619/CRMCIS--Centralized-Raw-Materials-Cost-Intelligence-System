/**
 * Utility Functions
 * 
 * Contains general-purpose helper functions used throughout the frontend.
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn (Class Name) Helper
 * 
 * Combines Tailwind CSS classes using 'clsx' and resolves conflicts using 'tailwind-merge'.
 * This is the standard pattern for dynamic class assignment in modern React/Tailwind apps.
 * 
 * @param inputs - A list of class values (strings, objects, arrays).
 * @returns A single, merged string of CSS classes.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format Number Helper
 * 
 * Formats large numbers with appropriate suffixes (K, M, B) for better readability.
 * 
 * @param num - The number to format.
 * @param decimals - Number of decimal places (default: 1).
 * @returns Formatted string with suffix.
 */
export function formatNumber(num, decimals = 1) {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  const n = Number(num);
  if (n === 0) return '0';
  
  if (Math.abs(n) < 1000) {
    return Number.isInteger(n) ? n.toString() : parseFloat(n.toFixed(decimals)).toString();
  }
  
  const k = 1000;
  const dm = Math.max(0, decimals);
  const sizes = ['', 'K', 'M', 'B', 'T'];
  
  const i = Math.min(Math.floor(Math.log(Math.abs(n)) / Math.log(k)), sizes.length - 1);
  return parseFloat((n / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}
