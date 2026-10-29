export const BASE_POINTS = 1000;
export const MAX_TIME_BONUS = 1000;

export interface ScoreCalculationParams {
  correct: boolean;
  timeSpent: number;
  timeLimit?: number;
}

export function calculateScore({ correct, timeSpent, timeLimit }: ScoreCalculationParams): number {
  if (!correct) return 0;
  let timeBonus = 0;
  if (timeLimit && timeLimit > 0) {
    timeBonus = Math.round(MAX_TIME_BONUS * Math.max(0, 1 - timeSpent / timeLimit));
  }
  return BASE_POINTS + timeBonus;
}

export function generateRoomCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function isAnswerCorrect(
  questionType: string,
  userAnswer: string,
  correctAnswer: string,
  matchingPairs?: Array<{ left: string; right: string }>
): boolean {
  if (questionType === 'matching') {
    if (!matchingPairs) return false;
    try {
      const userPairs: Array<{ left: string; right: string }> = JSON.parse(userAnswer);
      return matchingPairs.every((pair) => {
        const up = userPairs.find((u) => u.left === pair.left);
        return up?.right === pair.right;
      });
    } catch { return false; }
  }
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
}

export function shouldDisqualify(tabSwitchCount: number, maxTabSwitches: number): boolean {
  return tabSwitchCount >= maxTabSwitches;
}

export function formatScore(score: number): string {
  return score.toLocaleString('vi-VN');
}

export function getRankSuffix(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}
