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
