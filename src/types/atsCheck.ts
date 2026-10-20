export type AtsRecommendationSeverity = "high" | "medium" | "low";

export type AtsRecommendation = {
  category: string;
  severity: AtsRecommendationSeverity;
  issue: string;
  fix: string;
};

export type AtsCheckResult = {
  score: number;
  atsReady: boolean;
  shouldEdit: boolean;
  overview: string;
  strengths: string[];
  recommendations: AtsRecommendation[];
  ivyNotes: string;
};
