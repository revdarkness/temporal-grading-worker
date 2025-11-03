export interface Submission {
  fileId: string;
  fileName: string;
  fileContent: string;
  submittedBy: string;
  submittedAt: Date;
  mimeType: string;
}

export interface Rubric {
  criteria: RubricCriterion[];
  totalPoints: number;
  passingScore?: number;
}

export interface RubricCriterion {
  name: string;
  description: string;
  maxPoints: number;
  weight?: number;
}

export interface GradingResult {
  submissionId: string;
  fileName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  criteriaScores: CriterionScore[];
  feedback: string;
  gradedAt: Date;
}

export interface CriterionScore {
  criterionName: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface GradingWorkflowInput {
  fileId: string;
  rubric: Rubric;
  folderId: string;
}
