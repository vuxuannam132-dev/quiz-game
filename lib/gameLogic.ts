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

export function isTrueValue(val?: string): boolean {
  if (!val) return false;
  const s = val.trim().toLowerCase();
  return (
    s === 't' ||
    s === 'true' ||
    s === 'đúng' ||
    s === 'dung' ||
    s === '1' ||
    s === 'a' ||
    s === 'option_0'
  );
}

export function isFalseValue(val?: string): boolean {
  if (!val) return false;
  const s = val.trim().toLowerCase();
  return (
    s === 'f' ||
    s === 'false' ||
    s === 'sai' ||
    s === '0' ||
    s === 'b' ||
    s === 'option_1'
  );
}

export function isTrueFalseMatch(ans1?: string, ans2?: string): boolean {
  if (!ans1 || !ans2) return false;
  if (ans1.trim().toLowerCase() === ans2.trim().toLowerCase()) return true;
  if (isTrueValue(ans1) && isTrueValue(ans2)) return true;
  if (isFalseValue(ans1) && isFalseValue(ans2)) return true;
  return false;
}

export function isAnswerCorrect(
  questionType: string,
  userAnswer: string,
  correctAnswer: string,
  matchingPairs?: Array<{ left: string; right: string }>,
  options?: Array<{ key: string; text: string }>
): boolean {
  if (!userAnswer || !correctAnswer) return false;

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

  if (questionType === 'true_false') {
    if (options && options.length >= 2) {
      const correctOpt = options.find((o) =>
        o.key.trim().toLowerCase() === correctAnswer.trim().toLowerCase() ||
        isTrueFalseMatch(o.key, correctAnswer) ||
        isTrueFalseMatch(o.text, correctAnswer)
      );
      if (correctOpt) {
        if (
          userAnswer.trim().toLowerCase() === correctOpt.key.trim().toLowerCase() ||
          userAnswer.trim().toLowerCase() === correctOpt.text.trim().toLowerCase() ||
          isTrueFalseMatch(userAnswer, correctOpt.key) ||
          isTrueFalseMatch(userAnswer, correctOpt.text)
        ) {
          return true;
        }
      }
    }
    return isTrueFalseMatch(userAnswer, correctAnswer);
  }

  if (userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
    return true;
  }

  if (options && options.length > 0) {
    const correctOpt = options.find((o) => o.key.trim().toLowerCase() === correctAnswer.trim().toLowerCase());
    if (correctOpt && userAnswer.trim().toLowerCase() === correctOpt.text.trim().toLowerCase()) {
      return true;
    }
    const userOpt = options.find((o) => o.key.trim().toLowerCase() === userAnswer.trim().toLowerCase());
    if (userOpt && userOpt.text.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
      return true;
    }
  }

  return false;
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
