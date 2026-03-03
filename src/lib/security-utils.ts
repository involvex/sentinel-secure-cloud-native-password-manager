import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';
const options = {
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.commonDictionary,
    ...zxcvbnEnPackage.enDictionary,
  },
};
zxcvbnOptions.setOptions(options);
export type StrengthLevel = 0 | 1 | 2 | 3 | 4;
export interface StrengthResult {
  score: StrengthLevel;
  label: string;
  color: string;
  suggestions: string[];
  warning?: string;
}
export function getStrengthData(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: 'None', color: 'bg-muted', suggestions: [] };
  }
  const result = zxcvbn(password);
  const score = result.score as StrengthLevel;
  const mapping: Record<StrengthLevel, { label: string; color: string }> = {
    0: { label: 'Very Weak', color: 'bg-destructive' },
    1: { label: 'Weak', color: 'bg-orange-500' },
    2: { label: 'Fair', color: 'bg-yellow-500' },
    3: { label: 'Strong', color: 'bg-blue-500' },
    4: { label: 'Exceptional', color: 'bg-emerald-500' },
  };
  return {
    score,
    label: mapping[score].label,
    color: mapping[score].color,
    suggestions: result.feedback.suggestions,
    warning: result.feedback.warning,
  };
}
/**
 * Simulates a breach check (HIBP style). 
 * In a real app, this would use a k-Anonymity API with SHA-1 prefixes.
 */
export async function checkPasswordBreach(password: string): Promise<{ isBreached: boolean; count: number }> {
  if (!password || password.length < 4) return { isBreached: false, count: 0 };
  // Deterministic simulation for demo purposes
  // Common passwords simulate "breached"
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'sentinel'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { isBreached: true, count: Math.floor(Math.random() * 1000000) + 50000 };
  }
  // Otherwise, use length/complexity to simulate randomness
  const isSimulatedBreach = password.length < 8;
  return { 
    isBreached: isSimulatedBreach, 
    count: isSimulatedBreach ? Math.floor(Math.random() * 100) : 0 
  };
}