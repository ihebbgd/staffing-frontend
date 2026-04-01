// FactorBreakdown — score components for a recommendation
export interface FactorBreakdown {
  skillMatch: number;
  skillLevel: number;
  availability: number;
  certScore: number;
  experience: number;
  skillMatchContribution: number;
  skillLevelContribution: number;
  availabilityContribution: number;
  certScoreContribution: number;
  experienceContribution: number;
  matchedSkillCount: number;
  requiredSkillCount: number;
}

// GET /api/recommendations/project/{projectId} — RecommendationResult
export interface RecommendationResult {
  employeeId: string;
  employeeName: string;
  jobTitle?: string;
  totalScore: number;
  breakdown: FactorBreakdown;
}
