import type { Flashcard } from "../types/study";

export type StudyGrade = "easy" | "medium" | "hard" | "incorrect";

const DIFFICULTY_WEIGHT: Record<Flashcard["difficulty"], number> = {
  hard: 30,
  medium: 15,
  easy: 5,
};

export function studyPriority(card: Flashcard) {
  const mastery = Number.isFinite(card.mastery) ? card.mastery : 0;
  const difficulty = DIFFICULTY_WEIGHT[card.difficulty] ?? DIFFICULTY_WEIGHT.medium;
  return difficulty + (100 - mastery);
}

export function buildStudyQueue(cards: Flashcard[]): Flashcard[] {
  return [...cards]
    .map((card) => ({
      card,
      score: studyPriority(card) + Math.random() * 12,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.card);
}

export function buildMatchRounds(
  cards: Flashcard[],
  pairsPerRound = 6
): Flashcard[][] {
  if (!cards.length) return [];
  const remaining = [...cards];
  const rounds: Flashcard[][] = [];

  while (remaining.length) {
    const roundSize = Math.min(pairsPerRound, remaining.length);
    const round: Flashcard[] = [];
    const pool = [...remaining];

    while (round.length < roundSize && pool.length) {
      const picked = weightedPick(pool);
      round.push(picked);
      const poolIdx = pool.findIndex((card) => card.id === picked.id);
      if (poolIdx >= 0) pool.splice(poolIdx, 1);
      const remainIdx = remaining.findIndex((card) => card.id === picked.id);
      if (remainIdx >= 0) remaining.splice(remainIdx, 1);
    }

    rounds.push(round);
  }

  return rounds;
}

function weightedPick(cards: Flashcard[]): Flashcard {
  const weights = cards.map((card) => {
    const difficultyMult =
      card.difficulty === "hard" ? 3 : card.difficulty === "medium" ? 2 : 1;
    const masteryFactor = 1 + (100 - (card.mastery ?? 0)) / 25;
    return Math.max(0.1, difficultyMult * masteryFactor);
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < cards.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return cards[i];
  }
  return cards[cards.length - 1];
}

export function masteryAfterGrade(current: number, grade: StudyGrade) {
  const value = Number.isFinite(current) ? current : 0;
  if (grade === "easy") return Math.min(100, value + 8);
  if (grade === "medium") return Math.min(100, value + 4);
  if (grade === "hard") return Math.max(0, value - 5);
  return Math.max(0, value - 12);
}
