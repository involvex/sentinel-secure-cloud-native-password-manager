import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import { adjacencyGraphs, dictionary as commonDictionary } from '@zxcvbn-ts/language-common';
import { dictionary, translations } from '@zxcvbn-ts/language-en';
const options = {
  translations,
  graphs: adjacencyGraphs,
  dictionary: {
    ...commonDictionary,
    ...dictionary,
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
  if (!password || password.length === 0) {
    return { score: 0, label: 'None', color: 'bg-muted', suggestions: [] };
  }
  const result = zxcvbn(password);
  const rawScore = result.score;
  const score = (rawScore >= 0 && rawScore <= 4 ? rawScore : 0) as StrengthLevel;
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
    suggestions: result.feedback.suggestions || [],
    warning: result.feedback.warning || undefined,
  };
}
export async function checkPasswordBreach(password: string): Promise<{ isBreached: boolean; count: number }> {
  if (!password || password.length < 4) return { isBreached: false, count: 0 };
  // Simulated breach check for demo purposes
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'sentinel', 'password123'];
  const normalized = password.toLowerCase().trim();
  if (commonPasswords.includes(normalized)) {
    return { isBreached: true, count: 154200 + Math.floor(Math.random() * 5000) };
  }
  // Length-based simulation: shorter passwords are more likely to have been breached historically
  if (password.length < 8) {
    return { isBreached: true, count: 12 + Math.floor(Math.random() * 88) };
  }
  return {
    isBreached: false,
    count: 0
  };
}