import * as dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import { GoogleDriveService } from './google-drive';
import { GeminiGradingService } from './gemini';
import { Submission, Rubric, GradingResult } from './types';
import * as fs from 'fs';
import * as path from 'path';

// Initialize services
const driveService = new GoogleDriveService();
const geminiService = new GeminiGradingService();

/**
 * Activity: Fetch submission from Google Drive
 */
export async function fetchSubmission(fileId: string): Promise<Submission> {
  console.log(`[Activity] Fetching submission: ${fileId}`);
  return await driveService.getSubmission(fileId);
}

/**
 * Activity: Grade submission using Gemini
 */
export async function gradeSubmission(
  submission: Submission,
  rubric: Rubric
): Promise<GradingResult> {
  console.log(`[Activity] Grading submission: ${submission.fileName}`);
  return await geminiService.gradeSubmission(submission, rubric);
}

/**
 * Activity: Save grading result locally (for development)
 */
export async function saveGradingResult(
  folderId: string,
  fileName: string,
  gradingResult: GradingResult,
  originalFileId: string
): Promise<string> {
  console.log(`[Activity] Saving grading result for: ${fileName}`);

  // Create grading-results directory if it doesn't exist
  const resultsDir = path.join(process.cwd(), 'grading-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Format the grading result
  const resultFileName = `${fileName.replace(/\.[^/.]+$/, '')}_GRADED.txt`;
  const resultFilePath = path.join(resultsDir, resultFileName);

  const content = `
================================================================================
GRADING RESULT
================================================================================

File: ${gradingResult.fileName}
Submission ID: ${gradingResult.submissionId}
Graded At: ${typeof gradingResult.gradedAt === 'string' ? gradingResult.gradedAt : gradingResult.gradedAt.toISOString()}

SCORE: ${gradingResult.totalScore}/${gradingResult.maxScore} (${gradingResult.percentage.toFixed(1)}%)
STATUS: ${gradingResult.passed ? 'PASSED ✓' : 'NEEDS IMPROVEMENT'}

================================================================================
DETAILED SCORES
================================================================================

${gradingResult.criteriaScores.map(cs => `
${cs.criterionName}: ${cs.score}/${cs.maxScore} points
${cs.feedback}
`).join('\n')}

================================================================================
OVERALL FEEDBACK
================================================================================

${gradingResult.feedback}

================================================================================
`;

  // Write to file
  fs.writeFileSync(resultFilePath, content.trim(), 'utf-8');

  console.log(`[Activity] Grading result saved to: ${resultFilePath}`);

  return resultFilePath;
}

/**
 * Activity: Send notification (placeholder for future implementation)
 */
export async function sendNotification(
  email: string,
  gradingResult: GradingResult
): Promise<void> {
  console.log(`[Activity] Sending notification to: ${email}`);
  // Placeholder - could integrate with email service
  console.log(`Notification would be sent to ${email} about grading result`);
}
