import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes, resolving conflicts optimally.
 * Essential for UI components and Shadcn/ui integration.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
