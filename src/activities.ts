import { GoogleDriveService } from './google-drive';
import { GeminiGradingService } from './gemini';
import { Submission, Rubric, GradingResult } from './types';

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
 * Activity: Save grading result to Google Drive
 */
export async function saveGradingResult(
  folderId: string,
  fileName: string,
  gradingResult: GradingResult,
  originalFileId: string
): Promise<string> {
  console.log(`[Activity] Saving grading result for: ${fileName}`);
  return await driveService.saveGradingResult(
    folderId,
    fileName,
    gradingResult,
    originalFileId
  );
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
