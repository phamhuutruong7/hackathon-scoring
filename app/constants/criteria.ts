// The 5 scoring criteria. Each is scored 0–100 and weighted 20%,
// so the weighted total equals the simple average of the five.
// A team may additionally receive a bonus of up to +10 points.

export interface Criterion {
  key: 'c1' | 'c2' | 'c3' | 'c4' | 'c5'
  label: string
  hint?: string
}

export const CRITERIA: Criterion[] = [
  { key: 'c1', label: 'Tính thực tiễn và Impact' },
  { key: 'c2', label: 'AI Depth & Innovation' },
  { key: 'c3', label: 'Chất lượng demo / AI agent thực tế' },
  { key: 'c4', label: 'Khả năng nhân rộng / áp dụng cho FHN' },
  { key: 'c5', label: 'Thuyết trình & trả lời Q&A' },
]

export const CRITERION_MAX = 100
export const BONUS_MAX = 10

export interface ScoreParts {
  c1: number
  c2: number
  c3: number
  c4: number
  c5: number
  bonus: number
}

// Final score = average of the 5 criteria (each 0–100) + bonus (0–10).
export function computeFinal(s: Partial<ScoreParts>): number {
  const avg =
    ((s.c1 ?? 0) + (s.c2 ?? 0) + (s.c3 ?? 0) + (s.c4 ?? 0) + (s.c5 ?? 0)) / 5
  return Math.round((avg + (s.bonus ?? 0)) * 100) / 100
}

export const ROUNDS = [
  { id: 1, name: 'Vòng 1 — Business Unit Leaders' },
  { id: 2, name: 'Vòng 2 — Bán kết' },
  { id: 3, name: 'Vòng 3 — Chung kết' },
] as const
