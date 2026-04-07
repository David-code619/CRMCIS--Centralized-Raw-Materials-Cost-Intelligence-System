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
  if (num === 0) return '0';
  
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['', 'K', 'M', 'B', 'T'];
  
  const i = Math.floor(Math.log(Math.abs(num)) / Math.log(k));
  
  return parseFloat((num / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}
