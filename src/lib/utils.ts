import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function getFaviconUrl(url: string | undefined): string {
  if (!url) return '';
  const domain = getDomainFromUrl(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export function maskCardNumber(number: string | undefined): string {
  if (!number) return '•••• •••• •••• ••••';
  const last4 = number.replace(/\s/g, '').slice(-4);
  return `•••• •••• •••• ${last4}`;
}
